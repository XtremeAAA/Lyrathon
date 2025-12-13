// --- Persistence Keys ---
const JOBS_KEY = 'lyrathonJobs';
const CANDIDATES_KEY = 'lyrathonCandidates';
const CURRENT_CANDIDATE_KEY = 'lyrathonCurrentCandidate';

// --- Data Arrays (Now initialized via loadData) ---
let jobs = [];
let candidates = [];
let currentCandidate = null;

// --- State Variables ---
let currentRequiredSkills = [];
let currentRecommendedSkills = [];
let currentSkills = [];
let editingJobId = null;
let isEditingProfile = false;

// --- Persistence Functions ---

/**
 * Loads data from localStorage, initializing global variables.
 */
function loadData() {
    console.log('Loading data from localStorage...');
    try {
        const storedJobs = localStorage.getItem(JOBS_KEY);
        if (storedJobs) {
            jobs = JSON.parse(storedJobs);
            console.log(`Loaded ${jobs.length} jobs.`);
            // Normalize loaded jobs: ensure expected fields exist to avoid runtime errors
            let normalized = false;
            jobs = jobs.map(j => {
                const job = { ...j };
                if (!Array.isArray(job.applications)) { job.applications = []; normalized = true; }
                if (!Array.isArray(job.requiredSkills)) { job.requiredSkills = []; normalized = true; }
                if (!Array.isArray(job.recommendedSkills)) { job.recommendedSkills = []; normalized = true; }
                if (typeof job.minYears !== 'number') { job.minYears = job.minYears ? Number(job.minYears) || 0 : 0; normalized = true; }
                if (typeof job.requiredRepos !== 'number') { job.requiredRepos = job.requiredRepos ? Number(job.requiredRepos) || 0 : 0; normalized = true; }
                if (typeof job.minimumMatch !== 'number') { job.minimumMatch = job.minimumMatch ? Number(job.minimumMatch) || 50 : 50; normalized = true; }
                if (!job.postedAt) { job.postedAt = Date.now(); normalized = true; }
                return job;
            });
            if (normalized) {
                console.log('Normalized stored jobs to ensure expected schema. Saving back to localStorage.');
                localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
            }
        }

        const storedCandidates = localStorage.getItem(CANDIDATES_KEY);
        if (storedCandidates) {
            candidates = JSON.parse(storedCandidates);
            console.log(`Loaded ${candidates.length} candidates.`);
            // Normalize candidates: ensure skills array and matches object exist
            let candNorm = false;
            candidates = candidates.map(c => {
                const cand = { ...c };
                if (!Array.isArray(cand.skills)) { cand.skills = []; candNorm = true; }
                if (!cand.matches || typeof cand.matches !== 'object') { cand.matches = {}; candNorm = true; }
                return cand;
            });
            if (candNorm) {
                console.log('Normalized stored candidates. Saving back to localStorage.');
                localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
            }
        }

        const storedCandidate = localStorage.getItem(CURRENT_CANDIDATE_KEY);
        if (storedCandidate) {
            currentCandidate = JSON.parse(storedCandidate);
            console.log('Loaded current candidate session.');
            // Ensure currentCandidate is present in candidates array and normalized
            if (currentCandidate) {
                if (!Array.isArray(currentCandidate.skills)) currentCandidate.skills = currentCandidate.skills || [];
                if (!currentCandidate.matches || typeof currentCandidate.matches !== 'object') currentCandidate.matches = {};
                const exists = candidates.find(c => c.id === currentCandidate.id);
                if (!exists) {
                    candidates.push(currentCandidate);
                    console.log('Added currentCandidate to candidates array during normalization.');
                    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
                }
                // persist possibly-normalized currentCandidate
                localStorage.setItem(CURRENT_CANDIDATE_KEY, JSON.stringify(currentCandidate));
            }
        }
    } catch (e) {
        console.error('Error loading data from localStorage:', e);
        // Clear corrupt storage if needed, or just proceed with empty arrays
    }
}

/**
 * Saves the current state of jobs and candidates to localStorage.
 */
function saveJobsAndCandidates() {
    try {
        localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
        localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
        console.log('Jobs and Candidates saved.');
    } catch (e) {
        console.error('Error saving jobs and candidates:', e);
    }
}

/**
 * Saves the currentCandidate session to localStorage.
 */
function saveCurrentCandidate() {
    try {
        if (currentCandidate) {
            localStorage.setItem(CURRENT_CANDIDATE_KEY, JSON.stringify(currentCandidate));
            console.log('Current Candidate saved.');
        } else {
            localStorage.removeItem(CURRENT_CANDIDATE_KEY);
        }
    } catch (e) {
        console.error('Error saving current candidate:', e);
    }
}

// --- Utility Functions ---

/**
 * Formats a timestamp into a readable date/time string.
 * @param {number} ts - The timestamp in milliseconds.
 * @returns {string} The formatted date/time string.
 */
function formatDateTime(ts) {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
}

/**
 * Checks if a candidate has a specific skill.
 * @param {string} skill - The skill to check.
 * @param {Object} candidate - The candidate object.
 * @returns {boolean} True if the candidate has the skill.
 */
function hasSkill(skill, candidate) {
    return candidate.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase());
}

/**
 * Calculates the percentage of recommended skills matched.
 * @param {Object} job - The job object.
 * @param {Object} candidate - The candidate object.
 * @returns {number} The match percentage (0-100).
 */
function calculateRecommendedMatch(job, candidate) {
    if (!job.recommendedSkills || job.recommendedSkills.length === 0) {
        return 100; // 100% if no recommended skills are listed
    }

    const matchedRecommended = job.recommendedSkills.filter(skill =>
        hasSkill(skill, candidate)
    ).length;

    return Math.round((matchedRecommended / job.recommendedSkills.length) * 100);
}

/**
 * Checks if a candidate meets all required skills for a job.
 * @param {Object} job - The job object.
 * @param {Object} candidate - The candidate object.
 * @returns {boolean} True if all required skills are met.
 */
function meetsRequiredSkills(job, candidate) {
    if (!job.requiredSkills || job.requiredSkills.length === 0) {
        return true;
    }
    return job.requiredSkills.every(skill => hasSkill(skill, candidate));
}

/**
 * Determines if a candidate is qualified for a job based on all criteria.
 * @param {Object} job - The job object.
 * @param {Object} candidate - The candidate object.
 * @returns {boolean} True if the candidate is qualified.
 */
function isQualified(job, candidate) {
    // 1. Minimum Years of Experience
    if (candidate.years < job.minYears) {
        return false;
    }

    // 2. Required Skills (Must meet ALL)
    if (!meetsRequiredSkills(job, candidate)) {
        return false;
    }

    // 3. Recommended Skills (Must meet minimum match percentage)
    const matchPercentage = calculateRecommendedMatch(job, candidate);
    if (matchPercentage < job.minimumMatch) {
        return false;
    }

    return true;
}

/**
 * Returns jobs visible to the candidate (i.e., jobs they are qualified for).
 * @returns {Object[]} The list of visible jobs.
 */
function getVisibleJobs() {
    if (!currentCandidate) return [];
    return jobs.filter(job => isQualified(job, currentCandidate));
}

/**
 * Finds all qualified candidates for a specific job.
 * @param {Object} job - The job object.
 * @returns {Object[]} The list of qualified candidates.
 */
function getQualifiedCandidates(job) {
    return candidates.filter(candidate => isQualified(job, candidate));
}

/**
 * Gets the count of qualified candidates for a job.
 * @param {Object} job - The job object.
 * @returns {number} The count.
 */
function getQualifiedCandidatesCount(job) {
    return candidates.filter(candidate => isQualified(job, candidate)).length;
}

// --- Candidate Portal Functions ---

/**
 * Renders the candidate's profile display based on currentCandidate.
 */
function renderProfileDisplay() {
    const profileSection = document.getElementById('profileCreationSection');
    const jobsSection = document.getElementById('jobsDisplaySection');
    
    // Default state: Show profile creation form
    profileSection.style.display = 'block';
    jobsSection.style.display = 'none';
    document.getElementById('candidateForm').reset();
    currentSkills = [];
    renderSkillsForm();

    if (!currentCandidate) {
        document.querySelector('#candidateForm button[type="submit"]').textContent = 'Create Profile';
        return;
    }

    // If candidate exists: hide creation, show display
    profileSection.style.display = 'none';
    jobsSection.style.display = 'block';

    document.getElementById('profileNameDisplay').textContent = currentCandidate.name;
    document.getElementById('profileEmailDisplay').textContent = currentCandidate.email;
    document.getElementById('profileYearsDisplay').textContent = `${currentCandidate.years} years`;
    document.getElementById('profileExperienceDisplay').textContent = currentCandidate.experience;

    const skillsDisplay = document.getElementById('profileSkillsDisplay');
    skillsDisplay.innerHTML = '';
    currentCandidate.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-skill';
        tag.textContent = skill;
        skillsDisplay.appendChild(tag);
    });

    renderMatchedJobs();
}

/**
 * Handles the submission of the candidate profile form.
 * @param {Event} e - The form submission event.
 */
function submitProfile(e) {
    e.preventDefault();

    const name = document.getElementById('candidateName').value.trim();
    const email = document.getElementById('candidateEmail').value.trim();
    const years = parseInt(document.getElementById('candidateYears').value, 10);
    const experience = document.getElementById('candidateExperience').value.trim();

    if (!name || !email || isNaN(years) || years < 0 || !experience || currentSkills.length === 0) {
        alert('Please fill out all required profile fields and add at least one skill.');
        return;
    }

    const isNewCandidate = !currentCandidate;
    let candidateToUpdate;

    if (isNewCandidate) {
        candidateToUpdate = {
            id: 'c' + Date.now(),
            name,
            email,
            years,
            experience,
            skills: [...currentSkills],
            matches: {}
        };
        candidates.push(candidateToUpdate);
    } else {
        candidateToUpdate = candidates.find(c => c.id === currentCandidate.id);
        if (candidateToUpdate) {
            candidateToUpdate.name = name;
            candidateToUpdate.email = email;
            candidateToUpdate.years = years;
            candidateToUpdate.experience = experience;
            candidateToUpdate.skills = [...currentSkills];
        }
    }

    currentCandidate = candidateToUpdate;
    currentSkills = []; // Clear for next use

    saveJobsAndCandidates(); // Save updated candidates array
    saveCurrentCandidate(); // Save the logged-in session

    renderProfileDisplay();
}

/**
 * Sets up the profile form for editing the current candidate's profile.
 */
function editProfile() {
    if (!currentCandidate) return;

    document.getElementById('profileCreationSection').style.display = 'block';
    document.getElementById('jobsDisplaySection').style.display = 'none';

    document.getElementById('candidateName').value = currentCandidate.name;
    document.getElementById('candidateEmail').value = currentCandidate.email;
    document.getElementById('candidateYears').value = currentCandidate.years;
    document.getElementById('candidateExperience').value = currentCandidate.experience;

    currentSkills = [...currentCandidate.skills];
    renderSkillsForm();

    const saveButton = document.querySelector('#candidateForm button[type="submit"]');
    saveButton.textContent = 'Save Profile Changes';
}

/**
 * Renders the list of skills in the profile creation form.
 */
function renderSkillsForm() {
    const skillsContainer = document.getElementById('profileSkillsInput');
    skillsContainer.innerHTML = '';
    currentSkills.forEach((skill, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-skill';
        tag.innerHTML = `${skill} <button type="button" class="remove-tag" onclick="removeSkill(${index})">x</button>`;
        skillsContainer.appendChild(tag);
    });
}

/**
 * Adds a skill to the candidate's temporary skill list.
 */
function addSkill() {
    const skillInput = document.getElementById('candidateSkillInput');
    const skill = skillInput.value.trim();

    if (skill && !currentSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
        currentSkills.push(skill);
        skillInput.value = '';
        renderSkillsForm();
    }
}

/**
 * Removes a skill from the candidate's temporary skill list.
 * @param {number} index - The index of the skill to remove.
 */
function removeSkill(index) {
    currentSkills.splice(index, 1);
    renderSkillsForm();
}

/**
 * Renders the list of jobs the candidate is qualified for.
 */
function renderMatchedJobs() {
    const matchedJobsList = document.getElementById('matchedJobsList');
    matchedJobsList.innerHTML = '';
    const visibleJobs = getVisibleJobs();

    if (!currentCandidate) return; // Should be checked by caller, but safe check

    if (visibleJobs.length === 0) {
        matchedJobsList.innerHTML = '<p>No jobs currently match your profile requirements.</p>';
        return;
    }

    visibleJobs.forEach(job => {
        const matchPercentage = calculateRecommendedMatch(job, currentCandidate);
        const application = (job.applications || []).find(app => app.candidateId === currentCandidate.id);
        const statusClass = application ? `app-status ${application.status}` : 'app-status not-applied';
        const statusText = application ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'New';

        const jobItem = document.createElement('div');
        jobItem.className = 'matched-job job-item';
        jobItem.innerHTML = `
            <h3>${job.title} at ${job.company}</h3>
            <p><strong>Required:</strong> ${job.requiredSkills.join(', ') || 'None'}</p>
            <p><strong>Recommended Match:</strong> <span class="tag tag-recommended">${matchPercentage}%</span> (Min: ${job.minimumMatch}%)</p>
            <p><strong>Status:</strong> <span class="${statusClass}">${statusText}</span></p>
            <div class="actions">
                ${application ?
                    (application.status === 'pending' ?
                        `<button disabled class="btn-secondary">Awaiting Review</button>` :
                        `<button disabled class="btn-primary">Application ${application.status}</button>`) :
                    `<button class="btn-primary" onclick="openMatchModal('${job.id}')">Apply Now</button>`
                }
            </div>
        `;
        matchedJobsList.appendChild(jobItem);
    });
}

// --- Job Application/Match Modal Functions ---

/**
 * Opens the modal for a candidate to submit repos for a specific job.
 * @param {string} jobId - The ID of the job to apply for.
 */
function openMatchModal(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const matchModal = document.getElementById('matchModalOverlay');
    matchModal.style.display = 'flex';

    document.getElementById('matchJobTitle').textContent = `${job.title} at ${job.company}`;
    document.getElementById('matchRequiredRepos').textContent = job.requiredRepos;
    document.getElementById('matchForm').dataset.jobId = jobId;

    // Reset repo inputs and enforce required attribute
    for (let i = 1; i <= 5; i++) {
        const repoInput = document.getElementById(`repo${i}`);
        repoInput.value = '';
        repoInput.required = (i <= job.requiredRepos);
        // Ensure inputs beyond the required count are visible but optional
        repoInput.closest('div').style.display = 'block'; 
    }
}

/**
 * Closes the match submission modal.
 */
function closeMatchModal() {
    document.getElementById('matchModalOverlay').style.display = 'none';
}

/**
 * Handles the submission of the application (repo links).
 * @param {Event} e - The form submission event.
 */
function submitMatch(e) {
    e.preventDefault();

    const jobId = e.target.dataset.jobId;
    const job = jobs.find(j => j.id === jobId);

    if (!job || !currentCandidate) {
        alert('Error: Job or Candidate not found.');
        return;
    }

    const repos = [];
    for (let i = 1; i <= 5; i++) {
        const repoUrl = document.getElementById(`repo${i}`).value.trim();
        if (repoUrl) {
            // Basic URL validation
            try {
                new URL(repoUrl);
                repos.push(repoUrl);
            } catch (_) {
                alert(`Please enter a valid URL for Repo ${i}.`);
                return;
            }
        }
    }

    if (repos.length < job.requiredRepos) {
        alert(`You must submit at least ${job.requiredRepos} repository links.`);
        return;
    }

    // Ensure job.applications exists
    job.applications = job.applications || [];

    // 1. Update the Job applications list
    const newApplication = {
        candidateId: currentCandidate.id,
        repos: repos,
        status: 'pending',
        appliedAt: Date.now()
    };
    job.applications.push(newApplication);

    // 2. Update the Candidate matches list (for quick reference) - not strictly necessary for this logic but kept for candidate model completeness
    currentCandidate.matches[jobId] = repos;

    // Save changes
    saveJobsAndCandidates();
    saveCurrentCandidate();

    alert('Application submitted successfully!');
    closeMatchModal();
    renderMatchedJobs(); // Refresh candidate's job list
    renderJobsList(); // Refresh company's job list (if open)
}

// --- Company Portal Functions ---

/**
 * Handles the submission of the job creation/edit form.
 * @param {Event} e - The form submission event.
 */
function postJob(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value.trim();
    const company = document.getElementById('jobCompany').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    const minYears = parseInt(document.getElementById('jobMinYears').value, 10);
    const requiredRepos = parseInt(document.getElementById('jobRequiredRepos').value, 10);
    const minimumMatch = parseInt(document.getElementById('minimumMatch').value, 10);

    if (!title || !company || !description || isNaN(minYears) || isNaN(requiredRepos) || currentRequiredSkills.length === 0) {
        alert('Please fill out all job details and specify required skills.');
        return;
    }

    const jobData = {
        title,
        company,
        description,
        minYears,
        requiredRepos,
        minimumMatch,
        requiredSkills: [...currentRequiredSkills],
        recommendedSkills: [...currentRecommendedSkills],
    };

    if (editingJobId) {
        // Edit existing job
        const jobIndex = jobs.findIndex(j => j.id === editingJobId);
        if (jobIndex > -1) {
            // Preserve existing data like ID, applications, and postedAt
            jobs[jobIndex] = { ...jobs[jobIndex], ...jobData };
            console.log('Job updated:', jobs[jobIndex]);
        }
        editingJobId = null;
    } else {
        // Create new job
        const newJob = {
            id: 'j' + Date.now(),
            ...jobData,
            applications: [], // Start with an empty applications array
            postedAt: Date.now()
        };
        jobs.push(newJob);
        console.log('New job posted:', newJob);
    }

    // Save data and refresh UI
    saveJobsAndCandidates();
    closeJobModal();
    renderJobsList();
    renderMatchedJobs(); // Update candidate view if a new job is posted/edited
}

/**
 * Opens the job creation modal.
 */
function openJobModal() {
    editingJobId = null; // Ensure we are creating a new job
    document.getElementById('jobForm').reset();
    document.getElementById('jobModalTitle').textContent = 'Post New Job';

    // Reset skill arrays
    currentRequiredSkills = [];
    currentRecommendedSkills = [];

    // Set default slider values and render tags
    document.getElementById('minimumMatch').value = 50;
    document.getElementById('minimumMatchValue').textContent = '50%';
    
    // Set default min years and repos
    document.getElementById('jobMinYears').value = 2;
    document.getElementById('jobRequiredRepos').value = 3;

    renderRequirements();

    document.getElementById('jobModalOverlay').style.display = 'flex';
}

/**
 * Opens the job modal pre-filled for editing.
 * @param {string} jobId - The ID of the job to edit.
 */
function openJobModalForEdit(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    editingJobId = jobId;
    document.getElementById('jobModalTitle').textContent = 'Edit Job';

    // Fill form fields
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('jobCompany').value = job.company;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('jobMinYears').value = job.minYears;
    document.getElementById('jobRequiredRepos').value = job.requiredRepos;

    // Set skill arrays and render
    currentRequiredSkills = [...job.requiredSkills];
    currentRecommendedSkills = [...job.recommendedSkills];
    document.getElementById('minimumMatch').value = job.minimumMatch;
    document.getElementById('minimumMatchValue').textContent = `${job.minimumMatch}%`;
    renderRequirements();

    document.getElementById('jobModalOverlay').style.display = 'flex';
}

/**
 * Closes the job creation/edit modal.
 */
function closeJobModal() {
    document.getElementById('jobModalOverlay').style.display = 'none';
    editingJobId = null;
}

/**
 * Renders the list of required and recommended skill tags in the job modal.
 */
function renderRequirements() {
    const requiredTags = document.getElementById('requiredTags');
    const recommendedTags = document.getElementById('recommendedTags');
    requiredTags.innerHTML = '';
    recommendedTags.innerHTML = '';

    currentRequiredSkills.forEach((skill) => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-required';
        tag.innerHTML = `${skill} <button type="button" class="remove-tag" onclick="removeRequirement('${skill}', 'required')">x</button>`;
        requiredTags.appendChild(tag);
    });

    currentRecommendedSkills.forEach((skill) => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-recommended';
        tag.innerHTML = `${skill} <button type="button" class="remove-tag" onclick="removeRequirement('${skill}', 'recommended')">x</button>`;
        recommendedTags.appendChild(tag);
    });
}

/**
 * Adds a skill requirement (required or recommended) to the temporary lists.
 */
function addRequirement() {
    const requirementInput = document.getElementById('requirement');
    const requirementType = document.getElementById('requirementType').value;
    const skill = requirementInput.value.trim();

    if (skill) {
        if (requirementType === 'required') {
            if (!currentRequiredSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
                currentRequiredSkills.push(skill);
            }
        } else {
            if (!currentRecommendedSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
                currentRecommendedSkills.push(skill);
            }
        }
        requirementInput.value = '';
        renderRequirements();
    }
}

/**
 * Removes a skill requirement from the temporary lists.
 * @param {string} skill - The skill to remove.
 * @param {string} type - 'required' or 'recommended'.
 */
function removeRequirement(skill, type) {
    if (type === 'required') {
        currentRequiredSkills = currentRequiredSkills.filter(s => s !== skill);
    } else {
        currentRecommendedSkills = currentRecommendedSkills.filter(s => s !== skill);
    }
    renderRequirements();
}

/**
 * Renders the list of all posted jobs for the company portal.
 */
function renderJobsList() {
    const jobsList = document.getElementById('jobsList');
    jobsList.innerHTML = '';

    if (jobs.length === 0) {
        jobsList.innerHTML = '<p>No jobs posted yet. Click the "+" to begin.</p>';
        return;
    }

    jobs.forEach(job => {
        // Ensure job.applications exists (guard for older stored jobs)
        const apps = job.applications || [];
        job.applications = apps;
        const qualifiedCount = getQualifiedCandidatesCount(job);
        const pendingApplications = apps.filter(app => app.status === 'pending').length;

        const jobItem = document.createElement('div');
        jobItem.className = 'job-item';
        jobItem.innerHTML = `
            <h3>${job.title} at ${job.company}</h3>
            <p>Posted: ${formatDateTime(job.postedAt)}</p>
            <p>Min Years: ${job.minYears} | Min Match: ${job.minimumMatch}% | Repos: ${job.requiredRepos}</p>
            <p>Required Skills: ${job.requiredSkills.map(s => `<span class="tag tag-required">${s}</span>`).join(' ')}</p>
            <p>Recommended Skills: ${job.recommendedSkills.map(s => `<span class="tag tag-recommended">${s}</span>`).join(' ')}</p>
            <p>Qualified Candidates: <span class="app-count-badge">${qualifiedCount}</span></p>
            <p>Pending Applications: <span class="app-count-badge app-count-pending">${pendingApplications}</span></p>
            <div class="actions">
                <button class="btn-secondary" onclick="openJobModalForEdit('${job.id}')">Edit Job</button>
                <button class="btn-primary" onclick="viewApplicants('${job.id}')">View Applicants (${apps.length})</button>
            </div>
        `;
        jobsList.appendChild(jobItem);
    });
}

/**
 * Opens a modal listing all applicants for a given job.
 * @param {string} jobId - The ID of the job.
 */
function viewApplicants(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Clear old content from the main modal body
    document.getElementById('applicantModalBody').innerHTML = '';
    document.getElementById('applicantActionButtons').innerHTML = '';

    const apps = job.applications || [];
    if (apps.length === 0) {
        const modalBody = document.getElementById('applicantModalBody');
        modalBody.innerHTML = `<h3>Applicants for: ${job.title}</h3><p>No applications yet.</p>`;
    } else {
        const listHtml = apps.map(app => {
            const candidate = candidates.find(c => c.id === app.candidateId);
            if (!candidate) return '';

            const statusClass = `app-status ${app.status}`;
            const statusText = app.status.charAt(0).toUpperCase() + app.status.slice(1);

            return `
                <div class="applicant-summary">
                    <span>${candidate.name} (${candidate.years} yrs)</span>
                    <span class="${statusClass}">${statusText}</span>
                    <button class="btn-secondary btn-small" onclick="openReviewModal('${candidate.id}', '${job.id}')">Review</button>
                </div>
            `;
        }).join('');

        const modalBody = document.getElementById('applicantModalBody');
        modalBody.innerHTML = `
            <h3>Applicants for: ${job.title}</h3>
            ${listHtml}
        `;
    }
    
    // Set title and open the modal
    document.querySelector('.applicant-modal h2').textContent = 'Review Applications';
    document.getElementById('applicantModalOverlay').style.display = 'flex';
}


/**
 * Opens the modal to review a specific candidate's application for a job.
 * NOTE: This function is renamed from openApplicantModal to openReviewModal
 * to distinguish it from the list view, but uses the same modal structure.
 * @param {string} candidateId - The ID of the candidate.
 * @param {string} jobId - The ID of the job they applied for.
 */
function openReviewModal(candidateId, jobId) {
    const job = jobs.find(j => j.id === jobId);
    const candidate = candidates.find(c => c.id === candidateId);
    const application = job?.applications.find(app => app.candidateId === candidateId);

    if (!job || !candidate || !application) {
        alert('Error: Application details not found.');
        return;
    }
    
    const modalBody = document.getElementById('applicantModalBody');
    modalBody.innerHTML = `
        <h2 id="applicantName">${candidate.name}</h2>
        <p>Applied for: <strong>${job.title}</strong></p>
        <p>Status: <span id="applicantApplicationStatus" class="app-status ${application.status}">${application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span></p>
        <p>Submitted: <span id="applicantSubmittedAt">${formatDateTime(application.appliedAt)}</span></p>
        <hr>

        <h3>Candidate Profile</h3>
        <p>Email: <span id="applicantEmail">${candidate.email}</span></p>
        <p>Experience: <span id="applicantYears">${candidate.years} years</span></p>
        <p>Summary: <span id="applicantExperience">${candidate.experience}</span></p>
        <div id="applicantSkills" class="tags-container profile-skills">
            ${candidate.skills.map(s => `<span class="tag tag-skill">${s}</span>`).join(' ')}
        </div>
        
        <h3>Submitted Repositories (Required: ${job.requiredRepos})</h3>
        <ul id="applicantRepos">
            ${application.repos.map(repoUrl => `<li><a href="${repoUrl}" target="_blank" rel="noopener noreferrer">${repoUrl}</a></li>`).join('')}
        </ul>
    `;

    // Action Buttons
    const actionButtons = document.getElementById('applicantActionButtons');
    actionButtons.innerHTML = '';

    if (application.status === 'pending') {
        actionButtons.innerHTML = `
            <button class="btn-accept" onclick="acceptApplication('${candidateId}', '${jobId}')">Accept</button>
            <button class="btn-reject" onclick="rejectApplication('${candidateId}', '${jobId}')">Reject</button>
        `;
    } else {
        actionButtons.innerHTML = `<p class="submitted-label">Application already ${application.status}.</p>`;
    }

    document.getElementById('applicantModalOverlay').style.display = 'flex';
}

/**
 * Closes the applicant review modal.
 */
function closeApplicantModal() {
    document.getElementById('applicantModalOverlay').style.display = 'none';
    // When closing the review modal, refresh the jobs list in case a status changed
    renderJobsList();
}

/**
 * Accepts a candidate's application for a job.
 * @param {string} candidateId - The ID of the candidate.
 * @param {string} jobId - The ID of the job.
 */
function acceptApplication(candidateId, jobId) {
    const job = jobs.find(j => j.id === jobId);
    const application = job?.applications.find(app => app.candidateId === candidateId);

    if (application) {
        application.status = 'accepted';
        application.decisionAt = Date.now();
        saveJobsAndCandidates(); // Save updated jobs array
        alert(`Application for ${job.title} accepted.`);
        openReviewModal(candidateId, jobId); // Refresh the modal view
    }
}

/**
 * Rejects a candidate's application for a job.
 * @param {string} candidateId - The ID of the candidate.
 * @param {string} jobId - The ID of the job.
 */
function rejectApplication(candidateId, jobId) {
    const job = jobs.find(j => j.id === jobId);
    const application = job?.applications.find(app => app.candidateId === candidateId);

    if (application) {
        application.status = 'rejected';
        application.decisionAt = Date.now();
        saveJobsAndCandidates(); // Save updated jobs array
        alert(`Application for ${job.title} rejected.`);
        openReviewModal(candidateId, jobId); // Refresh the modal view
    }
}

// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load data from localStorage on startup
    loadData();

    // 2. Initial rendering based on loaded state
    renderJobsList();
    renderProfileDisplay(); 

    // Event Listeners for the Company Portal (Job Creation/Edit)
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', postJob);
        document.getElementById('requirementButton').addEventListener('click', addRequirement);
        document.getElementById('minimumMatch').addEventListener('input', (e) => {
            document.getElementById('minimumMatchValue').textContent = `${e.target.value}%`;
        });
        document.getElementById('openJobModalButton').addEventListener('click', openJobModal);
        document.querySelector('.job-modal .close').addEventListener('click', closeJobModal);
    }

    // Event Listeners for the Candidate Portal (Profile & Application)
    const candidateForm = document.getElementById('candidateForm');
    if (candidateForm) {
        candidateForm.addEventListener('submit', submitProfile);
        document.getElementById('profileAddSkillButton').addEventListener('click', addSkill);
        document.getElementById('editProfileButton').addEventListener('click', editProfile);
    }

    const matchForm = document.getElementById('matchForm');
    if (matchForm) {
        matchForm.addEventListener('submit', submitMatch);
        document.querySelector('.match-modal .close').addEventListener('click', closeMatchModal);
    }

    // Event Listener for Applicant Modal (Close)
    document.querySelector('.applicant-modal .close').addEventListener('click', closeApplicantModal);

    // Initial skill form rendering (for new candidate profile)
    renderSkillsForm();
});

// Expose functions globally for inline HTML event handlers (e.g., onclick)
window.openJobModalForEdit = openJobModalForEdit;
window.viewApplicants = viewApplicants;
window.openReviewModal = openReviewModal; // Renamed for clarity in JS but uses same modal
window.acceptApplication = acceptApplication;
window.rejectApplication = rejectApplication;
window.openMatchModal = openMatchModal;
window.removeRequirement = removeRequirement;
window.removeSkill = removeSkill;
window.editProfile = editProfile;
window.closeApplicantModal = closeApplicantModal;
window.closeMatchModal = closeMatchModal;
window.closeJobModal = closeJobModal;