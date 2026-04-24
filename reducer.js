import io from "socket.io-client";

export const initialState = {
  basket: ["hungtd", "tdhung"],
  user: null,
  currentstockprice: [],
  // Stocklist: ["TCM","PVT, "HPG", "CTG", "BID", "DXG"],
  // hoseindex: [],
  // privatemsgv2.vps.com.vn/socket.io
  // wss://bgdatafeed.vps.com.vn/socket.io/?EIO=4&transport=websocket&sid=mGgM3oXOTCOYLX5MA4v8

  socket: io("https://bgdatafeed.vps.com.vn/"),
};

// Selector
// export const getBasketTotal = (basket) =>
//   basket?.reduce((Gain, item) => item.price + Gain, 0);

const reducer = (state, action) => {
  // console.log(action);
  // let IsStockexit = false;
  let index;
  switch (action.type) {
    case "ADD_STOCK_TO_LIST":
      index = state.Stocklist.findIndex(
        (StocklistItem) => StocklistItem === action.item
      );
      // console.log(tempindex);
      if (index >= 0) {
        return {
          ...state,
          Stocklist: [...state.Stocklist],
        };
      } else {
        return {
          ...state,
          Stocklist: [...state.Stocklist, action.item],
        };
      }
    case "DEL_STOCK_TO_LIST":
      let newStocklist = [...state.Stocklist];
      index = newStocklist.indexOf(action.item);
      // console.log(index);
      // console.log(newStocklist);
      if (index === -1) {
        return {
          ...state,
          Stocklist: [...state.Stocklist],
        };
      } else {
        newStocklist.splice(index, 1);
        // console.log(newStocklist);
        return {
          ...state,
          Stocklist: newStocklist,
        };
      }
    // console.log(currentstockprice);
    case "UPDATE_TO_CURRENTSTOCKPRICE":
      index = state.currentstockprice.findIndex(
        (currentstockpriceItem) => currentstockpriceItem.sym === action.item.sym
      );
      let newcurrentstockprice = [...state.currentstockprice];

      if (index >= 0) {
        // newBasket.splice(index, 1);
        // console.warn(newcurrentstockprice[index].lastPrice);
        newcurrentstockprice[index].lastPrice = action.item.lastPrice;
        // console.warn(newcurrentstockprice[index].mat);
      } else {
        //khong co can add them
        newcurrentstockprice = [...state.currentstockprice, action.item];
      }

      return {
        ...state,
        currentstockprice: newcurrentstockprice,
      };

    // case "SET_STOCK_INDEX":

    default:
      return state;
  }
};

export default reducer;
