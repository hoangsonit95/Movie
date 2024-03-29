const moviesList = require('../models/MoviesList');
const genreList = require('../models/genreList');
const videoList = require('../models/videoList');

const numOfPage = 20;

exports.getMoviesTrending = (req, res, next) => {
  moviesList.fetchAll(movieList => {
    const page = req.params.page || 1;
    movieList.sort((a, b) => b.popularity - a.popularity);
    res.status(200).send({
      results: movieList.slice(page * numOfPage - numOfPage, page * numOfPage),
      page: page,
      total_page: Math.ceil(movieList.length / numOfPage),
    });
  });
};

exports.getMoviesTopRate = (req, res, next) => {
  moviesList.fetchAll(movieList => {
    const page = req.params.page || 1;
    movieList.sort((a, b) => b.vote_average - a.vote_average);
    res.status(200).send({
      results: movieList.slice(page * numOfPage - numOfPage, page * numOfPage),
      page: page,
      total_page: Math.ceil(movieList.length / numOfPage),
    });
  });
};

exports.getMoviesDiscover = (req, res, next) => {
  if (req.params.genreId === undefined) {
    res.status(400).send('Not found genre param');
  } else {
    const genreId = +req.params.genreId;
    const page = req.params.page || 1;
    let moviesDiscover = [];
    moviesList.fetchAll(moviesList => {
      moviesList.forEach(movie => {
        if (movie.genre_ids != undefined) {
          const a = movie.genre_ids.filter(id => id === genreId);
          if (a.length > 0) moviesDiscover.push(movie);
        }
      });
      if (moviesDiscover.length === 0) {
        res.status(404).send('Not found that genre id');
      } else {
        genreList.fetchAll(genreList => {
          const genre_name = genreList.find(item => item.id === genreId).name;
          res.status(200).send({
            results: moviesDiscover.slice(
              (page - 1) * numOfPage,
              page * numOfPage
            ),
            page: page,
            total_pages: Math.ceil(moviesDiscover.length / numOfPage),
            genre_name: genre_name,
          });
        });
      }
    });
  }
};

exports.getMovieTrailer = (req, res, next) => {
  if (req.params.movieId === undefined) {
    res.status(400).send('Not found film_id parram');
  } else {
    const movieId = +req.params.movieId;
    let videos = [];
    let videoTrailer = [];
    videoList.fetchAll(videoList => {
      const videoOfMovie = videoList.filter(movie => movie.id === movieId)[0];
      if (!videoOfMovie) {
        res.status(404).send('Not found video');
      } else {
        videos = videoOfMovie.videos.filter(
          video =>
            video.official === true &&
            video.site === 'YouTube' &&
            (video.type === 'Trailer' || video.type === 'Teaser')
        );
        // nếu videos có type='Trailer' thì xoá video type='Teaser'
        let a = videos.filter(video => video.type === 'Trailer');
        if (a.length > 0) {
          videoTrailer = a;
        } else videoTrailer = videos;

        // sắp xếp video theo ngày publish gần nhất
        videoTrailer.sort((a, b) => {
          var c = new Date(a.published_at);
          var d = new Date(b.published_at);
          return d - c;
        });
        res.status(200).send(videoTrailer[0]);
      }
    });
  }
};

exports.getMovieSearch = (req, res, next) => {
  if (req.params.keyword === undefined) {
    res.status(400).send('Not found keyword param');
  } else {
    const movieSearch = [];
    const page = req.params.page || 1;
    const keyword = req.params.keyword.toLowerCase();
    moviesList.fetchAll(moviesList => {
      moviesList.forEach(movie => {
        if (movie.title !== undefined && movie.overview !== undefined) {
          const a =
            movie.title.toLowerCase().includes(keyword) ||
            movie.overview.toLowerCase().includes(keyword);
          if (a === true) {
            movieSearch.push(movie);
          }
        }
      });
      if (movieSearch.length === 0) {
        res.status(404).send('Not found this keyword!');
      } else {
        res.status(200).send({
          results: movieSearch.slice(page * 20 - 20, page * 20),
          page: page,
          total_pages: Math.ceil(movieSearch.length / 20),
        });
      }
    });
  }
};

exports.getMovieId = (req, res, next) => {
  if (req.params.id === undefined) {
    res.status(404).send('Not found this movie id');
  } else {
    let movie;
    const id = +req.params.id;
    moviesList.fetchAll(moviesList => {
      movie = moviesList.filter(movie => movie.id === id)[0];

      if (movie) {
        res.status(200).send(movie);
      } else {
        res.status(404).send('Not found this movie id');
      }
    });
  }
};

exports.getMovieMultiSearch = (req, res, next) => {
  const { name, year, discover, media, language } = req.query;
  const page = req.params.page;
  const movieSearch = [];
  moviesList.fetchAll(moviesList => {
    moviesList.forEach(movie => {
      if (
        movie.title !== undefined ||
        movie.name !== undefined ||
        movie.overview !== undefined
      ) {
        const a =
          name === '' ||
          movie.title?.toLowerCase().includes(name) ||
          movie.name?.toLowerCase().includes(name) ||
          movie.overview?.toLowerCase().includes(name);
        const b =
          year === '' ||
          new Date(movie.release_date).getFullYear() === Number(year);
        const c =
          discover === '' || movie.genre_ids?.includes(Number(discover));
        const d = media === '' || movie.media_type === media;
        const e =
          language === '' || movie.original_language?.includes(language);
        if (a && b && c && d && e) {
          movieSearch.push(movie);
        }
      }
    });

    if (movieSearch.length === 0) {
      res.status(404).send('Not found this keyword!');
    } else {
      res.status(200).send({
        results: movieSearch.slice(page * 20 - 20, page * 20),
        page: page,
        total_pages: Math.ceil(movieSearch.length / 20),
      });
    }
  });
};
