import React from "react";
import axios from "axios";
import MovieCard from "./MovieCard";
import "./movies-list.css";

const MoviesList = () => {
  const [movies, setMovies] = React.useState();
  const [errorMessage, setErrorMessage] = React.useState();

  React.useEffect(() => {
    const fetchMovies = async () => {
      try {
        const result = await axios.get("http://localhost:8000/api/v1/movies", {
          validateStatus: status => status < 500
        });

        setMovies(result.data);
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="movies-list-wrapper">
      <span className="title">Awesome Hacker Movies</span>
      {errorMessage && <span>{errorMessage}</span>}
      {movies && (
        <span>
          {movies.length > 0 ? (
            <div className="movies-list">
              {movies.map(({ _id, ...rest }) => (
                <MovieCard {...rest} />
              ))}
            </div>
          ) : (
            <div>There are no movies in database!</div>
          )}
        </span>
      )}
      {!errorMessage && !movies && <span>Loading...</span>}
    </div>
  );
};

export default React.memo(MoviesList);
