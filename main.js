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

// Function to handle the Skip action
function skipIdea() {
    currentIndex1 = getRandomIndex(currentIndex2);
    currentIndex2 = getRandomIndex(currentIndex1);
    displayIdeas();
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
    const winnerRating = ideas[winnerIndex].rating || 1200;  // Ensure default rating
    const loserRating = ideas[loserIndex].rating || 1200;    // Ensure default rating

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
        const q = query(collection(db, "ideas"), orderBy("rating", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        const leaderboardContainer = document.getElementById('leaderboard-entries');
        leaderboardContainer.innerHTML = '';  // Clear existing leaderboard

        querySnapshot.forEach((doc) => {
            const ideaData = doc.data();
            const ideaSnippet = ideaData.content.length > 20 ? ideaData.content.substring(0, 20) + '...' : ideaData.content;
            
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';

            entryDiv.innerHTML = `
                <span class="idea-title">${ideaSnippet}</span>
                <div class="idea-details" style="display: none;">
                    <p>${ideaData.content}</p>
                </div>
            `;
            entryDiv.onclick = () => toggleIdeaDetails(entryDiv);
            leaderboardContainer.appendChild(entryDiv);
        });

    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

function toggleIdeaDetails(entryDiv) {
    const detailsDiv = entryDiv.querySelector('.idea-details');
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
    } else {
        detailsDiv.style.display = 'none';
    }
}

// Function to toggle the leaderboard's expanded state
function toggleLeaderboardExpanded() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.classList.toggle('expanded');

    // Automatically scroll to top when expanded
    if (leaderboard.classList.contains('expanded')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Function to handle scroll and collapse the leaderboard
function handleScroll() {
    const leaderboard = document.getElementById('leaderboard');
    const threshold = 100; // Adjust this value based on when you want it to collapse

    if (window.scrollY <= threshold && leaderboard.classList.contains('expanded')) {
        leaderboard.classList.remove('expanded');
    }
}

// Attach the click event to the leaderboard title
document.querySelector('.leaderboard-header').addEventListener('click', toggleLeaderboardExpanded);

// Expose the vote, skip, and toggleLeaderboardExpanded functions to the global scope
window.vote = vote;
window.skipIdea = skipIdea;
window.toggleLeaderboardExpanded = toggleLeaderboardExpanded;
window.addEventListener('scroll', handleScroll);

// Ensure both loadIdeas and loadLeaderboard are called when the page loads
window.onload = () => {
    loadIdeas();
    loadLeaderboard();
};
