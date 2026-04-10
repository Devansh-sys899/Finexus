import axios from "axios";

const instance = axios.create({
  baseURL: "https://finexus-5h8c.onrender.com", 
  withCredentials: true, 
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/signup" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
