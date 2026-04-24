import { useEffect, useState } from "react";
import { useStateValue } from "../StateProvider"; // Lấy state & socket từ Context

export function useStockRealtime(stockList = []) {
  const [{ socket }, dispatch] = useStateValue();
  const [prices, setPrices] = useState({});
  const [highlight, setHighlight] = useState({});

  useEffect(() => {
    if (!socket) return;

    // Khi component mount, đăng ký nhận dữ liệu
    if (stockList.length > 0) {
      socket.emit("subscribe_stocks", stockList); // Tùy theo API thực tế
    }

    // Nhận dữ liệu từ server
    socket.on("stock_update", (data) => {
      // Giả sử data = { symbol: "TCM", price: 25.5 }
      setPrices((prev) => {
        const oldPrice = prev[data.symbol];
        const newPrice = data.price;

        // Cập nhật giá mới
        const updatedPrices = { ...prev, [data.symbol]: newPrice };

        // Highlight khi giá thay đổi
        if (oldPrice !== undefined && oldPrice !== newPrice) {
          setHighlight((prevH) => ({
            ...prevH,
            [data.symbol]: newPrice > oldPrice ? "up" : "down",
          }));

          // Reset highlight sau 800ms
          setTimeout(() => {
            setHighlight((prevH) => ({ ...prevH, [data.symbol]: null }));
          }, 800);
        }

        return updatedPrices;
      });
    });

    // Cleanup khi unmount
    return () => {
      socket.off("stock_update");
      if (stockList.length > 0) {
        socket.emit("unsubscribe_stocks", stockList); // Tùy API thực tế
      }
    };
  }, [socket, stockList]);

  return { prices, highlight };
}
