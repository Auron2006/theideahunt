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

// Load the ideas from the database
async function loadIdeas() {
    try {
        const querySnapshot = await getDocs(collection(db, "ideas"));
        ideas = [];
        querySnapshot.forEach((doc) => {
            ideas.push({ ...doc.data(), id: doc.id });
        });
        console.log('Ideas loaded:', ideas);
        displayIdeas();
    } catch (error) {
        console.error('Error loading ideas:', error);
    }
}

// Get a random index for selecting ideas to vote on
function getRandomIndex(excludeIndex) {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * ideas.length);
    } while (randomIndex === excludeIndex);
    return randomIndex;
}

function showHeartAnimation(ideaElement) {
    const heart = document.createElement('div');
    heart.className = 'heart-animation';
    heart.innerHTML = '❤️';

    // Position the heart over the clicked idea
    const rect = ideaElement.getBoundingClientRect();
    heart.style.left = `${rect.left + rect.width / 2}px`;
    heart.style.top = `${rect.top + rect.height / 2}px`;

    document.body.appendChild(heart);

    // Trigger animation and remove the heart after animation ends
    setTimeout(() => {
        heart.classList.add('animate');
    }, 10);

    setTimeout(() => {
        heart.remove();
    }, 1000); // Duration for heart to disappear
}


// Display the selected ideas for voting with recency bias less than 5 matches
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

// Calculate the Elo rating
function calculateElo(currentRating, opponentRating, actualScore, kFactor = 32) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    return currentRating + kFactor * (actualScore - expectedScore);
}

// Handle the Skip action
function skipIdea() {
    // Simply call the displayIdeas function to skip the current pair and load a new one
    displayIdeas();
}

// Handle voting and updating ratings
async function vote(chosenIdea) {
    let winnerIndex, loserIndex;

    const ideaElement = document.getElementById(chosenIdea);

    // Show the heart animation
    showHeartAnimation(ideaElement);

    if (chosenIdea === 'idea1') {
        winnerIndex = currentIndex1;
        loserIndex = currentIndex2;
    } else {
        winnerIndex = currentIndex2;
        loserIndex = currentIndex1;
    }

    const winnerRating = ideas[winnerIndex].rating || 1200;
    const loserRating = ideas[loserIndex].rating || 1200;

    const newWinnerRating = calculateElo(winnerRating, loserRating, 1);
    const newLoserRating = calculateElo(loserRating, winnerRating, 0);

    try {
        const winnerDocRef = doc(db, "ideas", ideas[winnerIndex].id);
        const loserDocRef = doc(db, "ideas", ideas[loserIndex].id);

        await updateDoc(winnerDocRef, { rating: newWinnerRating });
        await updateDoc(loserDocRef, { rating: newLoserRating });

        console.log(`Updated ratings: ${ideas[winnerIndex].content} -> ${newWinnerRating}, ${ideas[loserIndex].content} -> ${newLoserRating}`);

    } catch (error) {
        console.error("Error updating ratings: ", error);
    }

    currentIndex1 = getRandomIndex(loserIndex);
    currentIndex2 = getRandomIndex(currentIndex1);
    displayIdeas();
}

// Handle idea submission
async function submitIdea(event) {
    event.preventDefault(); // Prevent the form from reloading the page

    const newIdeaContent = document.getElementById('newIdea').value.trim();
    const submitterName = document.getElementById('submitterName').value.trim(); // Get the name

    if (newIdeaContent) {
        try {
            console.log("Attempting to submit idea:", newIdeaContent, submitterName);
            await addDoc(collection(db, "ideas"), {
                content: newIdeaContent,
                rating: 1200,  // Default rating for new ideas
                name: submitterName || "Anonymous",  // Default to "Anonymous" if name is empty
                date: new Date().toISOString(),  // Set the current date
                number_of_matches: 0  // Initialize matches to 0
            });
            console.log("Idea submitted successfully.");
            alert("Idea added successfully!");
            document.getElementById('newIdea').value = ''; // Clear the input field
            document.getElementById('submitterName').value = ''; // Clear the name field
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("There was an error submitting your idea.");
        }
    } else {
        alert('Please enter an idea before submitting.');
    }
}

document.getElementById('ideaForm').addEventListener('submit', submitIdea);


// Load and display the leaderboard
async function loadLeaderboard() {
    try {
        const q = query(collection(db, "ideas"), orderBy("rating", "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        const leaderboardContainer = document.getElementById('leaderboard-entries');
        leaderboardContainer.innerHTML = '';

        let position = 1;

        querySnapshot.forEach((doc) => {
            const ideaData = doc.data();
            const ideaSnippet = ideaData.content.length > 20 ? ideaData.content.substring(0, 20) + '...' : ideaData.content;
            const submitterName = ideaData.name || "Anonymous"; // Use "Anonymous" if no name provided

            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            entryDiv.onclick = () => toggleIdeaDetails(entryDiv);

            entryDiv.innerHTML = `
                <span class="idea-position">${position}.</span>
                <span class="idea-title">${ideaSnippet}</span>
                <span class="idea-author" style="font-style: italic; margin-left: 10px;">- ${submitterName}</span>
                <div class="idea-details" style="display: none;">
                    <p>${ideaData.content}</p>
                </div>
            `;

            leaderboardContainer.appendChild(entryDiv);

            position++;
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Toggle the details of each idea in the leaderboard
function toggleIdeaDetails(entryDiv) {
    const detailsDiv = entryDiv.querySelector('.idea-details');
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
}

// Toggle the leaderboard's expanded state
function toggleLeaderboardExpanded() {
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.classList.toggle('expanded');

    if (leaderboard.classList.contains('expanded')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'block';
        });
    } else {
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'none';
        });
    }
}

// Handle scroll and collapse the leaderboard
function handleScroll() {
    const leaderboard = document.getElementById('leaderboard');
    if (window.scrollY <= 100 && leaderboard.classList.contains('expanded')) {
        leaderboard.classList.remove('expanded');
        document.querySelectorAll('.leaderboard-entry').forEach(entry => {
            entry.style.display = 'none';
        });
    }
}

// Attach the click event to the leaderboard title
document.querySelector('.leaderboard-header').addEventListener('click', toggleLeaderboardExpanded);

// Expose the functions to the global scope
window.vote = vote;
window.skipIdea = skipIdea;
window.submitIdea = submitIdea;
window.toggleLeaderboardExpanded = toggleLeaderboardExpanded;
window.addEventListener('scroll', handleScroll);

// Ensure both loadIdeas and loadLeaderboard are called when the page loads
window.onload = () => {
    loadIdeas();
    loadLeaderboard();
};
