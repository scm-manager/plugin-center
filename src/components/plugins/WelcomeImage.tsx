import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import { GatsbyImage } from "gatsby-plugin-image";

export default function() {
  const data = useStaticQuery(graphql`
    {
      file(relativePath: { eq: "images/hero-image.png" }) {
        childImageSharp {
          gatsbyImageData(width: 720, layout: CONSTRAINED, placeholder: BLURRED)
        }
      }
    }
  `);

  return (
    <div className="section-image">
      <GatsbyImage
        image={data.file.childImageSharp.gatsbyImageData}
        alt="SCM-Manager Process Image"
      />
    </div>
  );
}
