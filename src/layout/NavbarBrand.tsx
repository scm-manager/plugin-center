import React from "react";
import { Link, useStaticQuery, graphql } from "gatsby";
import { GatsbyImage } from "gatsby-plugin-image";
import NavbarBurger from "./NavbarBurger";
import { NavbarProps } from "./NavbarProps";

const NavbarBrand = (props: NavbarProps) => {
  const data = useStaticQuery(graphql`{
  file(relativePath: {eq: "images/scm-manager_logo.png"}) {
    childImageSharp {
      gatsbyImageData(width: 327, height: 80, layout: FIXED, placeholder: BLURRED)
    }
  }
}
`);
  return (
    <div className="navbar-brand">
      <div className="navbar-item">
        <Link className="brand" to="/">
          <div className="brand-icon">
            <GatsbyImage
              image={data.file.childImageSharp.gatsbyImageData}
              alt="SCM-Manager"
              loading="eager" />
          </div>
        </Link>
      </div>
      <NavbarBurger {...props} />
    </div>
  );
};

export default NavbarBrand;
