def analyze_resume(resume_text, job_description):
    result = {}

    resume_words = set(resume_text.lower().split())
    job_words = set(job_description.lower().split())

    matched_skills = resume_words.intersection(job_words)

    result["matched_skills"] = list(matched_skills)
    result["match_percentage"] = round(len(matched_skills) / len(job_words) * 100, 2) if job_words else 0

    if result["match_percentage"] < 50:
        result["suggestion"] = "Add more relevant skills to improve match."
    else:
        result["suggestion"] = "Good match! Improve formatting and clarity."

    return result


if __name__ == "__main__":
    resume = "Python developer with API and backend experience"
    job = "Looking for Python backend developer with API skills"

    print(analyze_resume(resume, job))