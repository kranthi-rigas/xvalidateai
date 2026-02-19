import React from "react";
import { footerLinks } from "../../../data/footerLinks";
import { Link } from "react-router-dom";
export default function FooterLinksFour({ allClasses }) {
  return (
    <>
      {footerLinks.map((elm, i) => (
        <div key={i} className="col-xl-2 col-lg-4 col-md-6">
          <div className={`${allClasses ? allClasses : ""}`}>{elm.title}</div>
          <div className="d-flex y-gap-10 flex-column text-white">
            {elm.links.map((itm, index) => {
              // Open Privacy Policy and Terms in new tab
              if (itm.href === "/privacy-policy" || itm.href === "/terms") {
                return (
                  <a key={index} href={itm.href} target="_blank" rel="noopener noreferrer">
                    {itm.label}
                  </a>
                );
              }
              return (
                <Link key={index} to={itm.href}>
                  {itm.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
