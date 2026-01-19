import { menuList } from "@/data/menu";
import { useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useContextElement } from "@/context/Context";
import ShopCart from "./ShopCart";
import CourseCart from "./CourseCart";
import EventCart from "./EventCart";

const CartToggle = ({ allClasses, parentClassess, isOpen, onToggle }) => {
  const { cartProducts, cartCourses, cartEvents } = useContextElement();
  const [menuItem, setMenuItem] = useState("");
  const [submenu, setSubmenu] = useState("");

  const { pathname } = useLocation();

  useEffect(() => {
    menuList.forEach((elm) => {
      elm?.links?.forEach((elm2) => {
        if (elm2.href?.split("/")[1] === pathname?.split("/")[1]) {
          setMenuItem(elm.title);
        } else {
          elm2?.links?.forEach((elm3) => {
            if (elm3.href?.split("/")[1] === pathname?.split("/")[1]) {
              setMenuItem(elm.title);
              setSubmenu(elm2.title);
            }
          });
        }
      });
    });
  }, [pathname]);

  return (
    <div className={parentClassess || ""}>
      <button
        type="button"
        style={{ position: "relative" }}
        onClick={onToggle}
        className={allClasses || ""}
      >
        <i className="text-20 icon icon-basket"></i>

        <div className="cartProductCount">
          {submenu === "Shop" && cartProducts.length}
          {menuItem === "Events" && cartEvents.length}
          {!(submenu === "Shop" || menuItem === "Events") && cartCourses.length}
        </div>
      </button>

      <div
        className={`toggle-element js-cart-toggle ${
          isOpen ? "-is-el-visible" : ""
        }`}
      >
        {submenu === "Shop" && <ShopCart />}
        {menuItem === "Events" && <EventCart />}
        {!(submenu === "Shop" || menuItem === "Events") && <CourseCart />}
      </div>
    </div>
  );
};

export default CartToggle;
