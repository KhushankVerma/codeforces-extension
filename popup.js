import { ENV } from './env.js';



const CONFIG = {
  API_BASE_URL: "https://codeforces.com/api",
  API_KEY: ENV.API_KEY,
  API_SECRET: ENV.API_SECRET,
};





async function getMe(){

  const myratings = await fetchRatings(ENV.MyHandles);
  
  const heading = document.getElementById("header");
  
  myratings.forEach((user) => {
      const elementme = document.createElement("div")
      elementme.innerHTML = `<h2 class=${getRatingClass(user.rating)}>${user.handle} | ${user.rating || "Unrated"}</h2>`
      // console.log(user.handle, user.rating)
      heading.appendChild(elementme)
    })
  }




async function computeSHA512(input) {
  // Encode the input string as a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Compute the SHA-512 hash
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);

  // Convert the ArrayBuffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

async function generateApiSig(methodName, params, apiKey, secret) {
  const rand = Math.floor(1000000 * Math.random()).toString(); // Random 6-character string
  const time = Math.floor(Date.now() / 1000); // Current Unix timestamp

  // Add apiKey and time to parameters
  params.apiKey = apiKey;
  params.time = time;
  // Sort parameters lexicographically by key, then by value
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  // Construct the signature string
  const signatureString = `${rand}/${methodName}?${sortedParams}#${secret}`;
  // Compute SHA-512 hash
  const hashHex = await computeSHA512(signatureString);
  // Combine rand and hash
  return `${rand}${hashHex}`;
}

async function fetchFriends() {
  const methodName = "user.friends";
  const params = { onlyOnline: false }; // Codeforces API doesn't require additional params for friends
  const apiSig = await generateApiSig(
    methodName,
    params,
    CONFIG.API_KEY,
    CONFIG.API_SECRET
  );

  const apiUrl = `${CONFIG.API_BASE_URL}/${methodName}?apiKey=${CONFIG.API_KEY}&onlyOnline=false&time=${params.time}&apiSig=${apiSig}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch friends.");
    const data = await response.json();
    if (data.status !== "OK") throw new Error(data.comment);
    return data.result; // List of friend handles
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
}

async function fetchRatings(handles) {
  const apiUrl = `https://codeforces.com/api/user.info?handles=${handles.join(
    ";"
  )}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Failed to fetch data.");
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
}

async function displayRatings() {
  getMe();
  const ratingsContainer = document.getElementById("ratings-container");
  ratingsContainer.innerHTML = "<p>Loading...</p>";
  const friends = await fetchFriends();
  // const friends = ["tourist"]
  const ratings = await fetchRatings(friends);
  if (ratings.length === 0) {
    ratingsContainer.innerHTML = `<p>Failed to load ratings. Please try again later. ${friends}</p>`;
    console.log("abc");
    console.log(friends);
    return;
  }

  ratingsContainer.innerHTML = "";
  ratings.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.className = "user";
    const ratingClass = getRatingClass(user.rating);
    userElement.innerHTML = `
      <strong class="${ratingClass}">${user.handle} | ${user.rating || "Unrated"}</strong> 
    `;
    ratingsContainer.appendChild(userElement);
  });
}

function getRatingClass(rating) {
  if (rating >= 2400) return "legendary-grandmaster";
  if (rating >= 2200) return "grandmaster";
  if (rating >= 1900) return "master";
  if (rating >= 1600) return "expert";
  if (rating >= 1400) return "specialist";
  if (rating >= 1200) return "pupil";
  return "newbie";
}

displayRatings();
