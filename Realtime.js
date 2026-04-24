import React, { useState, useEffect, useRef } from "react";
import "./Realtime.css";
import { useStateValue } from "../StateProvider";
import { strimstring, useInterval } from "./Functions";
// import { getCurrentDate, strimstring, useInterval } from "./Functions";
import VnIndexChart from "./VNIndexChart";
// import ReactSession from "./Utils/ReactSession";
import db from "./firebase";

import ListComponent from "./ListComponent";
import NavigationLinks from "./NavigationLinks";

//index link: https://bgapidatafeed.vps.com.vn/getlistindexdetail/10

function Realtime() {
  // let socketLink = "https://bgdatafeed.vps.com.vn/";
  const [NewStockValue, setNewStockValue] = useState("Begin");
  const [StockItems, setStockItems] = useState([]);
  const [VNIndex, setVNIndex] = useState([]);
  const [matchStockValue, setmatchStockValue] = useState([]);
  // const matchStockValue = [];
  // const [WebSocketInitState, setWebSocketInitState] = useState(false);
  // prettier-ignore
  // const [{ socket   , currentstockprice }, dispatch] = useStateValue();
  const [{ socket    }, dispatch] = useStateValue();
  // prettier-ignore
  // const [Stocklist, setStocklist] = useState(JSON.parse(localStorage.getItem("stockid")));
  // ✅ Khởi tạo Stocklist từ localStorage trước
  const [Stocklist, setStocklist] = useState(() => {
        const data = localStorage.getItem("stockid");
        return data ? JSON.parse(data) : ["FRT", "CEO", "DIG", "BID", "VCB"];
        });
  // const [Stocklist, setStocklist] = useState([]);
  const [InitStockItems, setInitStockItems] = useState(false);
  const [IsConnected, setIsConnected] = useState(false);
  const [BuyStocksTemp, setBuyStocksTemp] = useState([]);

  const isStockItems = useRef(false);
  const isFirstRef = useRef(true);
  const isNewStockItems = useRef(false);

  // const temparray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // some list of items

  useEffect(() => {
    if (isNewStockItems.current) {
      // Initialize stock items
      initStockItems();

      // Update local storage with Stocklist
      localStorage.setItem("stockid", JSON.stringify(Stocklist));

      // Reset isNewStockItems flag
      isNewStockItems.current = false;
    }
    // đăng ký lại room
    let msg = '{"action":"join","list":"' + Stocklist.join(",") + '"}';
    // console.log(msg);
    // console.log(ReactSession.get("Stock_List"));
    socket.emit("regs", msg);
    console.log("CONNECTED");
    // Update UI to indicate connection status
    setIsConnected(true);
    const connectioncircleID = document.querySelector("#connectioncircle");
    if (connectioncircleID) {
      connectioncircleID.style.backgroundColor = "blue";
    }
    // Set a timeout to reset isConnected state after 3 seconds
    const timeout = setTimeout(() => {
      setIsConnected(false);
    }, 3000);

    // Clean up the timeout to avoid memory leaks
    return () => clearTimeout(timeout);

    // Dependency array ensures useEffect runs when Stocklist changes
  }, [Stocklist]);

  // let socket;
  // initWebsocket();
  // socketConnect();
  useEffect(() => {
    //for the first render
    if (isFirstRef.current) {
      console.log("First Render");
      initStockItems();
      getVNindex();
      isFirstRef.current = false;
      isStockItems.current = true;
      socketConnect();
      //firebase get buy stock to add stock list
      db.collection("Stocks")
        .orderBy("IsSold")
        .startAt(false)
        .endAt(false)
        .onSnapshot((snapshot) => {
          // console.log("Test");
          // console.log(snapshot.docs.map((doc) => doc.data()));
          setBuyStocksTemp(snapshot.docs.map((doc) => doc.data()));
        });

      return;
    }
  }, []);

  useEffect(() => {
    BuyStocksTemp.forEach((item) => {
      if (item.MaCK !== "") {
        let index = Stocklist.findIndex((stock) => stock === item.MaCK);

        if (index === -1) {
          setStocklist((currentStocklist) => [item.MaCK, ...currentStocklist]);
          isNewStockItems.current = true;
          console.log("Added new stock:", item.MaCK);
        } else {
          console.log("Stock already exists:", item.MaCK);
        }
      }
    });
  }, [BuyStocksTemp]);

  useEffect(() => {
    StockItems.forEach((item) => {
      dispatch({
        type: "UPDATE_TO_CURRENTSTOCKPRICE",
        item: {
          sym: item.sym,
          lastPrice: item.lastPrice,
        },
      });
    });
  }, [StockItems, dispatch]);

  async function getdata() {
    try {
      console.log("Before fetching data", Stocklist);

      const response = await fetch(
        "https://bgapidatafeed.vps.com.vn/getliststockdata/" +
          Stocklist.join(",")
      );

      const body = await response.json();
      console.log("Fetched data", body);

      if (body !== undefined) {
        setStockItems(body);
        console.log("After updating StockItems", body);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  // prettier-ignore
  function socketConnect() {
    socket.on("board", function (zdata) {
      // sendQueue(zdata.data);
      // console.log("board:", zdata.data);
      //Cap nhat thong tin bang gia
      // 42["board",{"data":{"id":3210,"sym":"REE","side":"S","g1":"34.90|314|i","g2":"35.00|1|i","g3":"35.10|259|i","vol4":0}}]
      //42["board",{"data":{"id":3310,"sym":"VCG","BVolume":43820,"SVolume":28860,"Total":13770,"AvePrice":17.2,"APColor":"e"}}]
      // console.log(InitStockItems);

      // console.log(zdata.data);
      // console.log(isStockItems.current);
      if (isStockItems.current && document.getElementById("MainCheck")) {
        updateStock(zdata.data);
      }
    });

    socket.on("index", function (zdata) {
      // console.log(zdata.data);
    });
    //Nếu khớp lệnh trả về thông tin khớp, chỉ trả về thông tin mã khớp
    socket.on("stock", function (zdata) {
      if (isStockItems.current && document.getElementById("MainCheck")) {
        updateStockMatch(zdata.data);
      }
    });
    socket.on("disconnect", () => {
      socket.removeAllListeners(); // Remove all event listeners from the socket
      setIsConnected(false); // Update state to indicate socket is disconnected

      const connectioncircleID = document.querySelector("#connectioncircle");
      if (connectioncircleID) {
        connectioncircleID.style.backgroundColor = "gray";
      }
    });
  }

  useInterval(() => {
    getVNindex();
  }, 60000);

  //thiet lap vong lap lay du lieu

  // prettier-ignore
  async function getVNindex() {
    try {
      const response = await fetch("https://bgapidatafeed.vps.com.vn/getlistindexdetail/10");
      const body = await response.json();

      if (body !== undefined && body.length > 0) {
        const indexData = body[0];
        const [chg, pct, tval] = indexData.ot.split("|");

        const tempindex = {
          ...VNIndex,
          idx: indexData.cIndex,
          idxopen: indexData.oIndex,
          idxchg: chg,
          idxpct: pct,
          tval: tval,
          tvol: indexData.vol,
          status: indexData.status
        };

        setVNIndex(tempindex);
      }
    } catch (error) {
      console.error("Failed to fetch VN index data:", error);
    }
  }

  //prettier-ignore
  async function initStockItems() {
    console.log("Fetching stock data");
    // privatemsgv2.vps.com.vn/socket.io/?EIO=4&transport=websocket&sid
    try {
      const response = await fetch(`https://bgapidatafeed.vps.com.vn/getliststockdata/${Stocklist.join(",")}`);
      const body = await response.json();

      if (body !== undefined) {
        setStockItems(() => body);
      }

      setInitStockItems(true);
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
    }
  }

  //Cap nhat thong tin ve bang gia, neu ben ban thi la S, mua la B
  const updateElementContent = (selector, newContent) => {
    const element = document.querySelector(selector);
    if (element && element.innerHTML !== newContent) {
      changeBackground(selector);
      element.innerHTML = newContent;
    }
  };
  //Cap nhat thong tin ve bang gia, neu ben ban thi la S, mua la B
  //prettier-ignore
  function updateStock(item) {
    //Neu gia khop la san ha noi se co id la 3310 voi thong tin tong mua, ban ngoai bang
    // if (item.id === 3310) console.log("Board", item);
    // if (item.id != 3310 && item.id != 3210) console.log("Board", item);
    // du kien khop lenh ma 3220
    //Realtime.js:272 Board {id: 3220, sym: "TCM", lastPrice: 74, lastVol: 0, cl: "d", …
    // console.log("cap nhat thong tin bang gia:", InitStockItems);
    //
    // console.log("Board", item);
    //Khop lenh ma 3210
    //prettier-ignore
    if (document.querySelector("#" + item.sym)) {
      if (isStockItems.current === true) {
        if (item.id === 3210) {
          // console.log(item.side);
          if (item.side === "B") {
          //buy 1
            updateElementContent("#" + item.sym + "-g1-vol", strimstring(item.g1.split("|")[1]));
            updateElementContent("#" + item.sym + "-g1-price", (item.g1.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g1"), ColorPrice(item.g1.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
            //buy 2
            updateElementContent("#" + item.sym + "-g2-vol", strimstring(item.g2.split("|")[1]));
            updateElementContent("#" + item.sym + "-g2-price", (item.g2.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g2"), ColorPrice(item.g2.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
            //buy 3
            updateElementContent("#" + item.sym + "-g3-vol", strimstring(item.g3.split("|")[1]));
            updateElementContent("#" + item.sym + "-g3-price", (item.g3.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g3"), ColorPrice(item.g3.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
          } else {
            //buy 4
            updateElementContent("#" + item.sym + "-g4-vol", strimstring(item.g1.split("|")[1]));
            updateElementContent("#" + item.sym + "-g4-price", (item.g1.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g4"), ColorPrice(item.g1.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
            //buy 5
            updateElementContent("#" + item.sym + "-g5-vol", strimstring(item.g2.split("|")[1]));
            updateElementContent("#" + item.sym + "-g5-price", (item.g2.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g5"), ColorPrice(item.g2.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
            //buy 6
            updateElementContent("#" + item.sym + "-g6-vol", strimstring(item.g3.split("|")[1]));
            updateElementContent("#" + item.sym + "-g6-price", (item.g3.split("|")[0]));
            changeColorBuySell (("#" + item.sym + "-g6"), ColorPrice(item.g3.split("|")[0],document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
          }
        }
        //{"id":3220,"sym":"TCB","lastPrice":25.3,"lastVol":100,"cl":"i","change":"0.50","changePc":"2.02","totalVol":108810,"time":"10:49:56","hp":25.3,"ch":"i","lp":24.9,"lc":"i","ap":25.1,"ca":"i"}
        else if (item.id === 3220) {
          //Check if still in Main Page then update match value
          updateStockMatch(item);
        }
      }
    }
  }
  // prettier-ignore
  function updateWebpageTitle(item) {
    const titleElement = document.querySelector(`#${item.sym}-lastPrice`);
    if (titleElement) {
      document.title = `${titleElement.innerHTML}|${document.querySelector(`#${item.sym}-changePc`).innerHTML}`;
    }

    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);

    const referencePrice = parseFloat(document.querySelector(`#${item.sym}-r`).innerHTML);
    const lastPrice = parseFloat(item.lastPrice);

    if (lastPrice < referencePrice) {
      link.href = "https://cdn0.iconfinder.com/data/icons/Hand_Drawn_Web_Icon_Set/128/arrow_down.png";
    } else if (lastPrice === referencePrice) {
      link.href = "https://cdn1.iconfinder.com/data/icons/smallicons-controls/32/614357-.svg-1024.png";
    } else {
      link.href = "https://cdn4.iconfinder.com/data/icons/business-and-finance-colorful-free-hand-drawn-set/100/growth-1024.png";
    }
  }
  //Cap nhat thong tin ve bang gia, neu ben ban thi la S, mua la B
  // prettier-ignore
  async function updateStockMatch(item) {
    // Example item: {"id":3220,"sym":"TCB","lastPrice":25.3,"lastVol":100,"cl":"i","change":"0.50","changePc":"2.02","totalVol":108810,"time":"10:49:56","hp":25.3,"ch":"i","lp":24.9,"lc":"i","ap":25.1,"ca":"i"}
    /* ------------------------------------------------------------------ *
     * 1️⃣  Show the raw JSON somewhere (debugging helper)                  *
     * ------------------------------------------------------------------ */
    const now = new Date();
    const timeStamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    setNewStockValue(`${timeStamp}: ${JSON.stringify(item)}`);
    let tempID;
    if (item.time) {
      //Set match value into array
      setmatchStockValue((prevArr) => [
        ...prevArr,
        {
          stockid: item.sym,
          stockside: item.side,
          timematch: item.time.substring(0, 5),
          volumematch: item.lastVol,
          pricematch: item.lastPrice,
        },
      ]);
    }
    /* ------------------------------------------------------------------ *
   * 2️⃣  Store the latest price in global state (Redux/Context …)       *
   * ------------------------------------------------------------------ */
    dispatch({
      type: "UPDATE_TO_CURRENTSTOCKPRICE",
      item: { sym: item.sym, lastPrice: item.lastPrice },
    });
    
    //uddate thong tin ck
    /* ------------------------------------------------------------------ *
    * 3️⃣  Special‑case logic (page title for CEO, etc.)                  *
    * ------------------------------------------------------------------ */
    if (item.sym === "CEO") updateWebpageTitle(item);

    /* ------------------------------------------------------------------ *
    * 4️⃣  Update the DOM – helper keeps it DRY                           *
    * ------------------------------------------------------------------ */
    
    updateDomElement("#" + item.sym + "-ot", item.change);
    updateDomElement("#" + item.sym + "-lastPrice", item.lastPrice,true);
    updateDomElement("#" + item.sym + "-lastVolume", strimstring(item.lastVol.toString()));
    updateDomElement("#" + item.sym + "-changePc", item.changePc + "%");
    updateDomElement("#" + item.sym + "-lot", strimstring(item.totalVol.toString()));
    tempID = document.querySelector("#" + item.sym + "-Max");
    if (tempID && tempID.innerHTML !== item.hp) {
      tempID.innerHTML = item.hp;
      changeBackground("#" + item.sym + "-Max");
      changeColorBuySell(("#" + item.sym + "-MaxAll"),ColorPrice(item.hp,document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
    }
    // tempstock.highPrice = item.hp;
    tempID = document.querySelector("#" + item.sym + "-Min");
    if (tempID && tempID.innerHTML !== item.hp) {
      tempID.innerHTML = item.lp;
      changeBackground("#" + item.sym + "-Min");
      changeColorBuySell(("#" + item.sym + "-MinAll"),ColorPrice(item.lp,document.querySelector("#" +item.sym + "-r").innerHTML,document.querySelector("#" +item.sym + "-f").innerHTML,document.querySelector("#" +item.sym + "-c").innerHTML))
    }
  }
  // prettier-ignore
  function updateDomElement(selector, newValue, isNumeric = false) {
    const element = document.querySelector(selector);
    // console.log(newValue + "|" + selector)
    if (element && element.innerHTML !== (isNumeric ? parseFloat(newValue) : newValue)) {
      element.innerHTML = newValue;
      changeBackground(selector);
    }
  }

  function ColorText(item1, item2) {
    //{{ color: item.lastPrice < item.r ? "red" : item.lastPrice > item.r ? "blue" : item.lastPrice = item.c ? "#ff25ff" : item.lastPrice = item.f ? "#1eeeee" : "black", }}
    if (parseFloat(item1) === item2.f) {
      return "txt-gia-san";
    } else if (parseFloat(item1) === item2.c) {
      return "txt-gia-tran";
    } else if (parseFloat(item1) === 0) {
      return "txt-gia-tc";
    } else if (parseFloat(item1) < item2.r) {
      return "txt-gia-thap";
    } else if (parseFloat(item1) > item2.r) {
      return "txt-gia-cao";
    } else {
      return "txt-gia-tc";
    }
  }
  function ColorPrice(pricenew, pricer, pricef, pricec) {
    //{{ color: item.lastPrice < item.r ? "red" : item.lastPrice > item.r ? "blue" : item.lastPrice = item.c ? "#ff25ff" : item.lastPrice = item.f ? "#1eeeee" : "black", }}
    // console.log(pricenew, pricer);
    if (parseFloat(pricenew) === parseFloat(pricef)) {
      return "txt-gia-san";
    } else if (parseFloat(pricenew) === parseFloat(pricec)) {
      return "txt-gia-tran";
    } else if (parseFloat(pricenew) === parseFloat(pricer)) {
      return "txt-gia-tc";
    } else if (parseFloat(pricenew) < parseFloat(pricer)) {
      return "txt-gia-thap";
    } else if (parseFloat(pricenew) > parseFloat(pricer)) {
      return "txt-gia-cao";
    }
  }

  const StockRows = (arr) =>
    arr &&
    arr.map((item, index) => (
      <div className="stockCard" key={index}>
        {/*prettier-ignore*/}
        <div className={ "stockCard__Header " +  ColorText(item.lastPrice, item) } id = {item.sym} >
          <div>{item.sym}</div>
          <div className="backgroundwhite" id = {item.sym + "-ot"} >{item.ot}</div>
          <div className="backgroundwhite" id = {item.sym + "-lastPrice"}>{item.lastPrice}</div>
          <div className="backgroundwhite" id = {item.sym + "-lastVolume"}>{strimstring(item.lastVolume.toString())}</div>
          <div className="backgroundwhite" id = {item.sym + "-changePc"}>{item.changePc}%</div>
          <div className="backgroundwhite" id = {item.sym + "-lot"}>{strimstring(item.lot.toString())}</div>
          {/*//tham chieu*/}
          <div  className= {  "fadeOut"} id = {item.sym + "-r"}>{item.r} </div>
          {/*//san*/}
          <div  className= {  "fadeOut"} id = {item.sym + "-f"}>{item.f} </div>
          {/*//tran*/}
          <div  className= {  "fadeOut"} id = {item.sym + "-c"}>{item.c} </div>
        </div>
        <div className="stockCard__Buy">
          <div className="BuyAmount">
            <div>Volume</div> <div>Bid</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"BuyAmount " + ColorText(item.g1.split("|")[0], item)} id = {item.sym + "-g1"}>
            <div className="backgroundwhite" id = {item.sym + "-g1-vol"}>{strimstring(item.g1.split("|")[1])}</div>
            <div className="backgroundwhite" id = {item.sym + "-g1-price"}>{item.g1.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"BuyAmount " + ColorText(item.g2.split("|")[0], item)} id = {item.sym + "-g2"}>
            <div className="backgroundwhite " id = {item.sym + "-g2-vol"}>{strimstring(item.g2.split("|")[1])}</div>
            <div className="backgroundwhite " id = {item.sym + "-g2-price"}>{item.g2.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"BuyAmount " + ColorText(item.g3.split("|")[0], item)} id = {item.sym + "-g3"}>
            <div className="backgroundwhite " id = {item.sym + "-g3-vol"}>{strimstring(item.g3.split("|")[1])}</div>
            <div className="backgroundwhite " id = {item.sym + "-g3-price"}>{item.g3.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"BuyAmount "+ ColorText(item.lowPrice, item) + " backgroundwhite"} id = {item.sym + "-MinAll"} style={{  borderTopWidth: 1, borderTopColor: "#A9A9A9",borderTopStyle: "solid",}}>
            <div>Min</div> <div  id = {item.sym + "-Min"}>{item.lowPrice}</div>
          </div>
        </div>
        <div className="stockCard__Sell">
          <div className="BuyAmount">
            <div>Volume</div> <div>Ask</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"SellAmount " + ColorText(item.g4.split("|")[0], item)} id = {item.sym + "-g4"}>
            <div className="backgroundwhite " id = {item.sym + "-g4-vol"}>{strimstring(item.g4.split("|")[1])}</div>
            <div className="backgroundwhite " id = {item.sym + "-g4-price"}>{item.g4.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"SellAmount " + ColorText(item.g5.split("|")[0], item)} id = {item.sym + "-g5"}>
            <div className="backgroundwhite" id = {item.sym + "-g5-vol"}>{strimstring(item.g5.split("|")[1])}</div>
            <div className="backgroundwhite" id = {item.sym + "-g5-price"}>{item.g5.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"SellAmount " + ColorText(item.g6.split("|")[0], item)} id = {item.sym + "-g6"}>
            <div className="backgroundwhite " id = {item.sym + "-g6-vol"}>{strimstring(item.g6.split("|")[1])}</div>
            <div  className="backgroundwhite " id = {item.sym + "-g6-price"}>{item.g6.split("|")[0]}</div>
          </div>
          {/*prettier-ignore*/}
          <div className={"BuyAmount "+ ColorText(item.highPrice, item) + " backgroundwhite"} id = {item.sym + "-MaxAll"} style={{  borderTopWidth: 1, borderTopColor: "#A9A9A9",borderTopStyle: "solid",}}>
            <div>Max</div> <div id = {item.sym + "-Max"}>{item.highPrice}</div>
          </div>
        </div>
        <div>
          <div className="stockCard__Match">
            <div>Match</div>
            <div className="no-scrollbars">
              {/*{matchStockValue.filter((item) => item.stockid === "CEO")}*/}
              {/*{matchStockValue.length}*/}
              <ListComponent
                // stockitem={temparray}
                stockitem={matchStockValue.filter(
                  (matchStockitem) => matchStockitem.stockid === item.sym
                )}
              />
            </div>
          </div>
        </div>
      </div>
    ));

  //doi nen background sang gray khi co thay doi
  function changeColorBuySell(divID, newStyle) {
    const element = document.querySelector(divID);
    if (element) {
      const currentStyle = element.classList.item(1);
      if (currentStyle !== newStyle) {
        element.classList.replace(currentStyle, newStyle);
      }
    }
  }

  //doi nen background sang gray khi co thay doi
  function changeBackground(divID) {
    const element = document.querySelector(divID);
    if (element) {
      // Change background to gray
      element.classList.replace("backgroundwhite", "backgroundgray");

      // Revert background to white after 3 seconds
      setTimeout(() => {
        element.classList.replace("backgroundgray", "backgroundwhite");
      }, 3000);
    } else {
      console.error(`Element with ID '${divID}' not found.`);
    }
  }

  //Cap nhat thong tin ve khop lenh
  // prettier-ignore
  const addStockToListClick = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const tempStock = document.getElementById("stockcodeinput").value.trim().toUpperCase(); // Get and clean the stock symbol input

    if (tempStock) { // Ensure tempStock is not empty
      const existingIndex = Stocklist.indexOf(tempStock);

      if (existingIndex === -1) { // If the stock symbol is not already in the array
        setStocklist((currentStocklist) => [tempStock, ...currentStocklist]); // Update Stocklist state by adding tempStock at the beginning
        isNewStockItems.current = true; // Set a flag indicating new stock items have been added (assuming isNewStockItems is a useRef)
      } else {
        console.log(`${tempStock} is already in the list.`);
      }
    } else {
      console.log("Please enter a valid stock symbol.");
    }
  };

  // prettier-ignore
  const delStockFromListClick = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const tempStock = document.getElementById("stockcodeinput").value.trim().toUpperCase(); // Get and clean the stock symbol input

    if (tempStock) { // Ensure tempStock is not empty
      const index = Stocklist.indexOf(tempStock); // Find the index of the stock symbol in Stocklist

      if (index !== -1) { // If the stock symbol is found in the array
        const newArray = Stocklist.filter((item, idx) => idx !== index); // Create a new array excluding the item to be deleted
        setStocklist(newArray); // Update Stocklist state with the new array
        isNewStockItems.current = true; // Set a flag indicating new stock items have been modified (assuming isNewStockItems is a useRef)
      } else {
        console.log(`${tempStock} is not found in the list.`);
      }
    } else {
      console.log("Please enter a valid stock symbol.");
    }
  };

  return (
    <div>
      {/* kiem tra co du lieu moi xuat ko bi loi */}
      {/*prettier-ignore*/}
      <div className="VNIndexContain" id ="MainCheck">
        <div>{<VnIndexChart />}</div>
        <div className="VNIndexContent" style={{ color: VNIndex.idx < VNIndex.idxopen ? "red" :  VNIndex.idx > VNIndex.idxopen ? "blue" : "black", }} >
          {/*prettier-ignore*/}
          <div className="VnIndex">{VNIndex.idx !== undefined ? parseFloat(VNIndex.idx).toLocaleString("en-US", { style: "decimal", currency: "USD", }) : "0"} </div>
          {/*prettier-ignore*/}
          <div className="VnIndex">{VNIndex.idxchg !== undefined ? VNIndex.idxchg : "0"}   </div>
          {/*prettier-ignore*/}
          <div className="VnIndex">{VNIndex.idxpct !== undefined ? VNIndex.idxpct : "0"}   </div>
          {/*prettier-ignore*/}
          <div className="VnIndex">{VNIndex.tval !== undefined ? parseInt(VNIndex.tval).toLocaleString("en-US", {style: "decimal",currency: "USD",}) : "0"} </div>
          {/*prettier-ignore*/}
          <div>
            <div>
              <a href="#"
                className="connection-circle notconnected"
                id="connectioncircle"
                onClick={(e) => {
                  e.preventDefault(); // Ngăn trình duyệt nhảy link
                  window.location.reload();
                }}
              ></a>
          </div>

          </div>
        </div>
        {/*<form >*/}
          <div>
            <div>
              <input
                  className="stockcodeinput"
                  // defaultValue={Stocklist.join(",")}
                  id="stockcodeinput"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }}
              />
            </div>
            <div>
              {/*prettier-ignore*/}
              <button className="addstocktolist" onClick={addStockToListClick}>Add Stock</button>
            </div>
            <div>
              {/*prettier-ignore*/}
              <button className="addstocktolist" onClick={delStockFromListClick}>Del Stock</button>
            </div>
          </div>
        {/*</form>*/}

      </div>
      {/* Link */}
      <NavigationLinks />
      <div className="realtime">{StockRows(StockItems)}</div>
      <div className="jsonValue">{NewStockValue}</div>
      {/*prettier-ignore*/}
      <div  className= {IsConnected ? "alert alert-success connection-alert connected-alert text-center fadeIn":  "fadeOut"}>
        <strong>Connected!</strong>
      </div>
      <div>{Stocklist.join(",")}</div>
    </div>
  );
}

export default Realtime;
