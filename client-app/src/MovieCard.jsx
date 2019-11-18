import React from "react";
import "./movie-card.css";

const MovieCard = ({ title, description }) => (
  <div className="movie-card">
    <span className="title">{title}</span>
    <span className="description">{description}</span>
  </div>
);

export default MovieCard;
