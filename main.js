import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, orderBy, limit, query } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAnL2LJhni_OwLEo8avKhGRv6AqEdRsZh0",
    authDomain: "theideahunt-74cd8.firebaseapp.com",
    projectId: "theideahunt-74cd8",
    storageBucket: "theideahunt-74cd8.appspot.com",
    messagingSenderId: "302655072510",
    appId: "1:302655072510:web:b66f02fe0862dbeae89daf",
    measurementId: "G-VW3BXP51Y1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let ideas = [];
let currentIndex1 = 0;
let currentIndex2 = 1;

async function loadIdeas() {
    try {
        const querySnapshot = await getDocs(collection(db, "ideas"));
        ideas = [];
        querySnapshot.forEach((doc) => {
            ideas.push({...doc.data(), id: doc.id});  // Store the document ID
        });
        console.log('Ideas loaded:', ideas);
        displayIdeas();
    } catch (error) {
        console.error('Error loading ideas:', error);
    }
}

function getRandomIndex(excludeIndex) {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * ideas.length);
    } while (randomIndex === excludeIndex);
    return randomIndex;
}

function displayIdeas() {
    if (ideas.length > 1) {
        currentIndex1 = getRandomIndex(null);
        currentIndex2 = getRandomIndex(currentIndex1);
        document.getElementById('idea1').querySelector('p').textContent = ideas[currentIndex1].content;
        document.getElementById('idea2').querySelector('p').textContent = ideas[currentIndex2].content;
    } else {
        console.error('Not enough ideas to display.');
    }
}

function calculateElo(currentRating, opponentRating, actualScore, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    return currentRating + kFactor * (actualScore - expectedScore);
}

async function vote(chosenIdea) {
    let winnerIndex, loserIndex;

    if (chosenIdea === 'idea1') {
        winnerIndex = currentIndex1;
        loserIndex = currentIndex2;
    } else {
        winnerIndex = currentIndex2;
        loserIndex = currentIndex1;
    }

    // Get current ratings
    const winnerRating = ideas[winnerIndex].rating;
    const loserRating = ideas[loserIndex].rating;

    // Calculate new ratings
    const newWinnerRating = calculateElo(winnerRating, loserRating, 1);
    const newLoserRating = calculateElo(loserRating, winnerRating, 0);

    // Update the ratings in the database
    try {
        const winnerDocRef = doc(db, "ideas", ideas[winnerIndex].id);
        const loserDocRef = doc(db, "ideas", ideas[loserIndex].id);

        await updateDoc(winnerDocRef, { rating: newWinnerRating });
        await updateDoc(loserDocRef, { rating: newLoserRating });

        console.log(`Updated ratings: ${ideas[winnerIndex].content} -> ${newWinnerRating}, ${ideas[loserIndex].content} -> ${newLoserRating}`);

    } catch (error) {
        console.error("Error updating ratings: ", error);
    }

    // Get new random ideas
    currentIndex1 = getRandomIndex(loserIndex);
    currentIndex2 = getRandomIndex(currentIndex1);
    displayIdeas();
}

// Function to handle idea submission
async function submitIdea(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const newIdeaContent = document.getElementById('newIdea').value.trim();
    if (newIdeaContent) {
        try {
            // Add a new document with a generated ID
            await addDoc(collection(db, "ideas"), {
                content: newIdeaContent,
                rating: 1200 // Default rating for new ideas
            });
            alert("Idea added successfully!");
            document.getElementById('newIdea').value = ''; // Clear the input field
            // Optionally, refresh the ideas list here if needed
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("There was an error submitting your idea.");
        }
    } else {
        alert('Please enter an idea before submitting.');
    }
}

async function loadLeaderboard() {
    try {
        const q = query(collection(db, "ideas"), orderBy("rating", "desc"), limit(3));
        const querySnapshot = await getDocs(q);
        
        const leaderboardContainer = document.getElementById('leaderboard');
        leaderboardContainer.innerHTML = '';  // Clear existing leaderboard

        querySnapshot.forEach((doc, index) => {
            const ideaData = doc.data();
            const ideaSnippet = ideaData.content.length > 20 ? ideaData.content.substring(0, 20) + '...' : ideaData.content;
            const ideaRating = parseInt(ideaData.rating, 10); // Ensure the rating is a number
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.onclick = () => toggleIdeaDetails(entryDiv);

            entryDiv.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="idea-title">${ideaSnippet}</span>
                <!-- If you want to display the rating, you can add the line back -->
                <!-- <span class="rating">${ideaRating}</span> -->
                <div class="idea-details">
                    <p>${ideaData.content}</p>
                </div>
            `;
            leaderboardContainer.appendChild(entryDiv);
        });

    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}


// Function to toggle the display of full idea details
function toggleIdeaDetails(entryDiv) {
    entryDiv.classList.toggle('open');
}

// Attach the submit event handler to the form
document.getElementById('ideaForm').addEventListener('submit', submitIdea);

// Expose the vote function to the global scope
window.vote = vote;

// Ensure both loadIdeas and loadLeaderboard are called when the page loads
window.onload = () => {
    loadIdeas();
    loadLeaderboard();
};

