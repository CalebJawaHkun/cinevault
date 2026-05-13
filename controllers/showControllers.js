import axios from "axios"
import Movie from "../models/Movie.js"
import Show from "../models/Show.js"

// Playing Movies (via TMDB)
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get(
            'https://api.themoviedb.org/3/movie/now_playing', {
                headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
            }
        )

        const movies = data.results
        res.json({success: true, movies})
    } catch(error) {
        console.error(error)
        res.json({success: false, message: error.message})
    }
}

// Add new show to database
export const addShow = async (req, res) => {
    try {
        const {movieId, showsInput, showPrice} = req.body
        let movie = await Movie.findById(movieId)

        if(!movie) {

            const [moviedetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`,{
                        headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
                    }
                ),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: {Authorization: `Bearer ${process.env.TMDB_API_KEY}`}
                })
            ])

            const movieApiData = moviedetailsResponse.data
            const movieCreditsData = movieCreditsResponse.data 

            const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }

            // add movie to the database 
            movie = await Movie.create(movieDetails)

        }

        const showToCreate = []
        showsInput.forEach(show => {
            const showDate = show.date

            show.time.forEach(time => {
                const dateTimeString = `${showDate}T${time}`
                // console.log('.........................................................................' +dateTimeString)
                showToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {}
                })
            })

        })

        if(showToCreate.length > 0)
            await Show.insertMany(showToCreate)

        res.status(201).json({success: true, message: 'Show added successfully~'})

    } catch(err) {
        console.error(err)
        res.status(400).json({success: false, message: err.message})       
    }
}

// GET all shows from the database

export const getShows = async (req, res) => {
    try {
        const shows = await Show
            .find({showDateTime: {$gte: new Date()}})
            .populate('movie')
            .sort({showDateTime: 1})

        const uniqueShows = new Set(shows.map(show => show.movie))
        
        res.json({success: true, shows: Array.from(uniqueShows)})
    } catch(err) {
        console.error(err)
        res.status(401).json({success: false, message: err.message})
    }
}

// GET a show
export const getShow = async (req, res) => {
    try {
        const {movieId} = req.params

        const shows = await Show
        .find(
            {movie: movieId, showDateTime: { $gte: new Date() }}
        )
        const movie = await Movie.findById(movieId)
        const dateTime = {};

        shows.forEach((show) => {
            const date = show
                .showDateTime
                .toISOString()
                .split("T")[0];

            if(!dateTime[date]){
                dateTime[date] = []
            }
            
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}