def retrieve_relevant_chunk(question, chunks):

    question_words = question.lower().split()

    best_chunk = ""
    best_score = 0

    for chunk in chunks:
        score = 0
        chunk_lower = chunk.lower()

        for word in question_words:
            if word in chunk_lower:
                score += 1

        if score > best_score:
            best_score = score
            best_chunk = chunk

    # 👇 IMPORTANT FIX
    if best_score < 2:
        return None

    return best_chunk