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
        const winnerDocRef = collection(db, "ideas").doc(ideas[winnerIndex].id);
        const loserDocRef = collection(db, "ideas").doc(ideas[loserIndex].id);

        await winnerDocRef.update({ rating: newWinnerRating });
        await loserDocRef.update({ rating: newLoserRating });

        console.log(`Updated ratings: ${ideas[winnerIndex].content} -> ${newWinnerRating}, ${ideas[loserIndex].content} -> ${newLoserRating}`);

    } catch (error) {
        console.error("Error updating ratings: ", error);
    }

    // Get new random ideas
    currentIndex1 = getRandomIndex(loserIndex);
    currentIndex2 = getRandomIndex(currentIndex1);
    displayIdeas();
}
