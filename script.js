// Data storage
let jobs = [];
let candidates = []; // store all candidate profiles for company view
let currentCandidate = null;
let currentRequiredSkills = [];
let currentRecommendedSkills = [];
let currentSkills = [];
let editingJobId = null;
let isEditingProfile = false;
let editingCandidateId = null;

// Tab switching
function switchTab(tab) {
    const companyPortal = document.getElementById('companyPortal');
    const candidatePortal = document.getElementById('candidatePortal');
    const companyTab = document.getElementById('companyTab');
    const candidateTab = document.getElementById('candidateTab');

    if (tab === 'company') {
        companyPortal.classList.add('active');
        candidatePortal.classList.remove('active');
        companyTab.classList.add('active');
        candidateTab.classList.remove('active');
    } else {
        candidatePortal.classList.add('active');
        companyPortal.classList.remove('active');
        candidateTab.classList.add('active');
        companyTab.classList.remove('active');
    }
}

// Update match value display
function updateMatchValue(value) {
    document.getElementById('matchValue').textContent = value;
    document.getElementById('matchValueText').textContent = value;
    // update slider background to show filled portion in blue
    const slider = document.getElementById('minimumMatch');
    if (slider) {
        const pct = Number(value);
        slider.style.background = `linear-gradient(90deg, #4f46e5 ${pct}%, #e5e7eb ${pct}%)`;
    }
}

// Add requirement
function addRequirement() {
    const input = document.getElementById('requirement');
    const typeSelect = document.getElementById('requirementType');
    const requirement = input.value.trim();
    const type = typeSelect.value;

    if (requirement) {
        if (type === 'required') {
            currentRequiredSkills.push(requirement);
        } else {
            currentRecommendedSkills.push(requirement);
        }
        input.value = '';
        renderRequirements();
    }
}

// Remove requirement
function removeRequirement(index, type) {
    if (type === 'required') {
        currentRequiredSkills.splice(index, 1);
    } else {
        currentRecommendedSkills.splice(index, 1);
    }
    renderRequirements();
}

// Render requirements
function renderRequirements() {
    const requiredContainer = document.getElementById('requiredTags');
    const recommendedContainer = document.getElementById('recommendedTags');
    
    requiredContainer.innerHTML = '';
    recommendedContainer.innerHTML = '';

    if (currentRequiredSkills.length === 0) {
        requiredContainer.innerHTML = '<span style="color: #9ca3af; font-size: 0.875rem;">No required skills added</span>';
    } else {
        currentRequiredSkills.forEach((req, index) => {
            const tag = document.createElement('span');
            tag.className = 'tag tag-required';
            tag.innerHTML = `
                ${req}
                <button class="tag-remove" onclick="removeRequirement(${index}, 'required')">✕</button>
            `;
            requiredContainer.appendChild(tag);
        });
    }

    if (currentRecommendedSkills.length === 0) {
        recommendedContainer.innerHTML = '<span style="color: #9ca3af; font-size: 0.875rem;">No recommended skills added</span>';
    } else {
        currentRecommendedSkills.forEach((req, index) => {
            const tag = document.createElement('span');
            tag.className = 'tag tag-recommended';
            tag.innerHTML = `
                ${req}
                <button class="tag-remove" onclick="removeRequirement(${index}, 'recommended')">✕</button>
            `;
            recommendedContainer.appendChild(tag);
        });
    }
}

// Add skill
function addSkill() {
    const input = document.getElementById('skill');
    const skill = input.value.trim();

    if (skill) {
        currentSkills.push(skill);
        input.value = '';
        renderSkills();
    }
}

// Remove skill
function removeSkill(index) {
    currentSkills.splice(index, 1);
    renderSkills();
}

// Render skills
function renderSkills() {
    const container = document.getElementById('skillsList');
    container.innerHTML = '';

    if (currentSkills.length === 0) {
        container.innerHTML = '<span style="color: #9ca3af; font-size: 0.875rem;">No skills added yet</span>';
    } else {
        currentSkills.forEach((skill, index) => {
            const tag = document.createElement('span');
            tag.className = 'tag tag-skill';
            tag.innerHTML = `
                ${skill}
                <button class="tag-remove" onclick="removeSkill(${index})">✕</button>
            `;
            container.appendChild(tag);
        });
    }
}

// Check if candidate has a skill that matches requirement
function hasSkill(candidateSkills, requirement) {
    const reqLower = requirement.toLowerCase();
    return candidateSkills.some(skill => {
        const skillLower = skill.toLowerCase();
        return skillLower.includes(reqLower) || reqLower.includes(skillLower);
    });
}

// Calculate match for recommended skills only
function calculateRecommendedMatch(recommendedSkills, candidateSkills) {
    if (recommendedSkills.length === 0) return 100; // If no recommended skills, 100% match
    
    let matches = 0;
    recommendedSkills.forEach(req => {
        if (hasSkill(candidateSkills, req)) {
            matches++;
        }
    });
    
    return (matches / recommendedSkills.length) * 100;
}

// Check if candidate meets all required skills
function meetsRequiredSkills(requiredSkills, candidateSkills) {
    if (requiredSkills.length === 0) return true; // No required skills means automatically qualified
    
    return requiredSkills.every(req => hasSkill(candidateSkills, req));
}

// Check if candidate qualifies for a job
// Accepts a job and a candidate object { skills: [...], years: number }
function isQualified(job, candidate) {
    const candidateSkills = (candidate && candidate.skills) ? candidate.skills : [];
    const candidateYears = (candidate && typeof candidate.years === 'number') ? candidate.years : 0;

    // Must meet minimum years requirement
    if (typeof job.minYears === 'number' && !isNaN(job.minYears)) {
        if (candidateYears < job.minYears) return false;
    }

    // Must have ALL required skills
    if (!meetsRequiredSkills(job.requiredSkills, candidateSkills)) {
        return false;
    }

    // Must meet minimum percentage of recommended skills
    const recommendedMatch = calculateRecommendedMatch(job.recommendedSkills, candidateSkills);
    return recommendedMatch >= job.minimumMatch;
}

// Get qualified candidates count for a job
function getQualifiedCandidatesCount(job) {
    // count all candidates that qualify for this job
    return candidates.filter(c => isQualified(job, c)).length;
}

function getQualifiedCandidates(job) {
    return candidates.filter(c => isQualified(job, c));
}

// Get visible jobs for current candidate
function getVisibleJobs() {
    if (!currentCandidate) return [];
    return jobs.filter(job => isQualified(job, currentCandidate));
}

// Post job
function postJob(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value.trim();
    const company = document.getElementById('companyName').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    const minimumMatch = parseInt(document.getElementById('minimumMatch').value);
    const minYearsInput = document.getElementById('jobMinYears');
    const minYears = minYearsInput ? parseInt(minYearsInput.value, 10) : NaN;

    if (!title || !company) {
        alert('Please fill in job title and company name');
        return;
    }

    if (currentRequiredSkills.length === 0 && currentRecommendedSkills.length === 0) {
        alert('Please add at least one required or recommended skill');
        return;
    }

    // Validate minimum years is provided and non-negative
    if (isNaN(minYears) || minYears < 0) {
        alert('Please enter a valid minimum years of experience (0 or more)');
        return;
    }

    if (editingJobId) {
        // update existing job
        const jobIndex = jobs.findIndex(j => j.id === editingJobId);
        if (jobIndex !== -1) {
            jobs[jobIndex].title = title;
            jobs[jobIndex].company = company;
            jobs[jobIndex].description = description;
            jobs[jobIndex].requiredSkills = [...currentRequiredSkills];
            jobs[jobIndex].recommendedSkills = [...currentRecommendedSkills];
            jobs[jobIndex].minimumMatch = minimumMatch;
            jobs[jobIndex].minYears = minYears;
        }
    } else {
        const job = {
            id: Date.now(),
            title,
            company,
            description,
            requiredSkills: [...currentRequiredSkills],
            recommendedSkills: [...currentRecommendedSkills],
            minimumMatch,
            minYears: minYears
        };

        jobs.push(job);
    }

    // Reset form
    document.getElementById('jobForm').reset();
    currentRequiredSkills = [];
    currentRecommendedSkills = [];
    renderRequirements();
    document.getElementById('minimumMatch').value = 50;
    updateMatchValue(50);

    // close modal if open
    closeJobModal();

    // clear editing state
    editingJobId = null;

    // Update displays
    renderJobs();
    if (currentCandidate) {
        renderMatchedJobs();
    }

    alert('Job posted successfully!');
}

// Render jobs list
function renderJobs() {
    const container = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<p class="empty-state">No jobs posted yet</p>';
        return;
    }

    container.innerHTML = '';

    jobs.forEach(job => {
        const qualifiedCount = getQualifiedCandidatesCount(job);
        const qualifiedApplicants = getQualifiedCandidates(job);

        const jobDiv = document.createElement('div');
        jobDiv.className = 'job-item';
        
        let requiredHTML = '';
        if (job.requiredSkills.length > 0) {
            requiredHTML = `
                <div class="job-requirements-section">
                    <p class="job-requirements-label">Required Skills:</p>
                    <div class="job-requirements">
                        ${job.requiredSkills.map(req => `<span class="requirement-tag requirement-required">${req}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        let recommendedHTML = '';
        if (job.recommendedSkills.length > 0) {
            recommendedHTML = `
                <div class="job-requirements-section">
                    <p class="job-requirements-label">Recommended Skills:</p>
                    <div class="job-requirements">
                        ${job.recommendedSkills.map(req => `<span class="requirement-tag requirement-recommended">${req}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        jobDiv.innerHTML = `
            <h3 class="job-title">${job.title}</h3>
            <button class="job-edit-btn" onclick="openJobModalForEdit(${job.id})">Edit</button>
                <p class="job-company">${job.company}</p>
                <p class="job-experience">${job.minYears ? 'Min ' + job.minYears + ' yrs' : 'Experience: Any'}</p>
            <p class="job-description">${job.description}</p>
            ${requiredHTML}
            ${recommendedHTML}
            <div class="job-footer">
                <p class="qualified-count">${qualifiedCount} qualified candidate(s) can see this job</p>
                <p class="minimum-match">Candidates must have ALL required skills + ${job.minimumMatch}% of recommended skills</p>
            </div>
            <div class="applicants-list">
                <p class="job-requirements-label">Qualified Applicants:</p>
                ${qualifiedApplicants.length === 0 ? '<p class="no-matches">No qualified applicants yet</p>' : qualifiedApplicants.map(app => `
                    <div class="applicant-item">
                        <p style="font-weight:700; margin-bottom:0.25rem;">${app.name}</p>
                        <p style="font-size:0.875rem; color:#6b7280; margin:0;">${app.email} • ${app.experience || ''}</p>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(jobDiv);
    });
}

// Submit candidate profile
function submitProfile(e) {
    e.preventDefault();

    const name = document.getElementById('candidateName').value.trim();
    const email = document.getElementById('candidateEmail').value.trim();
    const experience = document.getElementById('candidateExperience').value.trim();

    if (!name || !email || currentSkills.length === 0) {
        alert('Please fill in all required fields and add at least one skill');
        return;
    }

    const years = document.getElementById('candidateYears') ? parseInt(document.getElementById('candidateYears').value || 0) : 0;

    const newProfile = {
        id: isEditingProfile ? editingCandidateId : Date.now(),
        name,
        email,
        experience,
        years,
        skills: [...currentSkills]
    };

    if (isEditingProfile) {
        // update existing candidate in candidates array
        const idx = candidates.findIndex(c => c.id === editingCandidateId);
        if (idx !== -1) candidates[idx] = newProfile;
        currentCandidate = newProfile;
        isEditingProfile = false;
        editingCandidateId = null;
    } else {
        currentCandidate = newProfile;
        candidates.push(newProfile);
    }

    // Hide profile creation, show jobs display
    document.getElementById('profileCreationSection').style.display = 'none';
    document.getElementById('jobsDisplaySection').style.display = 'block';

    // Display profile info
    document.getElementById('profileNameDisplay').textContent = currentCandidate.name;
    document.getElementById('profileEmailDisplay').textContent = currentCandidate.email + (currentCandidate.years ? (' • ' + currentCandidate.years + ' yrs') : '');
    
    const skillsDisplay = document.getElementById('profileSkillsDisplay');
    skillsDisplay.innerHTML = '';
    currentCandidate.skills.forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-skill';
        tag.textContent = skill;
        skillsDisplay.appendChild(tag);
    });

    // Update displays
    renderMatchedJobs();
    renderJobs(); // Update job list to show qualified count and applicants

    alert('Profile saved successfully!');
}

// Edit profile
function editProfile() {
    // Show profile creation, hide jobs display
    document.getElementById('profileCreationSection').style.display = 'block';
    document.getElementById('jobsDisplaySection').style.display = 'none';

    // Pre-fill form with current data for editing
    document.getElementById('candidateName').value = currentCandidate.name;
    document.getElementById('candidateEmail').value = currentCandidate.email;
    document.getElementById('candidateExperience').value = currentCandidate.experience;
    document.getElementById('candidateYears').value = currentCandidate.years || '';
    currentSkills = [...currentCandidate.skills];
    renderSkills();
    isEditingProfile = true;
    editingCandidateId = currentCandidate.id;
}

// Modal controls for job creation/editing
function openJobModal() {
    editingJobId = null;
    document.getElementById('modalTitle').textContent = 'Create Job';
    document.getElementById('jobForm').reset();
    currentRequiredSkills = [];
    currentRecommendedSkills = [];
    renderRequirements();
    document.getElementById('jobModalOverlay').classList.add('active');
    document.getElementById('jobModalOverlay').setAttribute('aria-hidden', 'false');
}

function closeJobModal() {
    document.getElementById('jobModalOverlay').classList.remove('active');
    document.getElementById('jobModalOverlay').setAttribute('aria-hidden', 'true');
}

function openJobModalForEdit(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    editingJobId = jobId;
    document.getElementById('modalTitle').textContent = 'Edit Job';
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('companyName').value = job.company;
    document.getElementById('jobDescription').value = job.description;
    document.getElementById('minimumMatch').value = job.minimumMatch || 50;
    document.getElementById('jobMinYears').value = job.minYears || '';
    updateMatchValue(document.getElementById('minimumMatch').value);

    currentRequiredSkills = [...(job.requiredSkills || [])];
    currentRecommendedSkills = [...(job.recommendedSkills || [])];
    renderRequirements();

    document.getElementById('jobModalOverlay').classList.add('active');
    document.getElementById('jobModalOverlay').setAttribute('aria-hidden', 'false');
}

// Render matched jobs for current candidate
function renderMatchedJobs() {
    const container = document.getElementById('matchedJobsList');
    
    if (!currentCandidate) {
        container.innerHTML = '<p class="empty-state">Create your profile to see matched jobs</p>';
        return;
    }

    const visibleJobs = getVisibleJobs();
    
    if (visibleJobs.length === 0) {
        container.innerHTML = '<p class="empty-state">No matching jobs available. Try adding more skills to your profile!</p>';
        return;
    }

    container.innerHTML = '';

    visibleJobs.forEach(job => {
        const recommendedMatch = Math.round(calculateRecommendedMatch(job.recommendedSkills, currentCandidate.skills));
        
        let requiredHTML = '';
        if (job.requiredSkills.length > 0) {
            requiredHTML = `
                <div class="job-requirements-section">
                    <p class="job-requirements-label">Required Skills:</p>
                    <div class="job-requirements">
                        ${job.requiredSkills.map(req => `<span class="requirement-tag requirement-required">${req}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        let recommendedHTML = '';
        if (job.recommendedSkills.length > 0) {
            recommendedHTML = `
                <div class="job-requirements-section">
                    <p class="job-requirements-label">Recommended Skills:</p>
                    <div class="job-requirements">
                        ${job.recommendedSkills.map(req => `<span class="requirement-tag requirement-recommended">${req}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        const jobDiv = document.createElement('div');
        jobDiv.className = 'matched-job';
        jobDiv.innerHTML = `
            <h4 class="job-title">${job.title}</h4>
            <p class="job-company">${job.company}</p>
            <p class="job-description">${job.description}</p>
            ${requiredHTML}
            ${recommendedHTML}
            <div class="match-indicator">
                <span style="color: #10b981; font-size: 1.25rem;">✓</span>
                <div>
                    <p class="match-percentage">Qualified for this position!</p>
                    <p class="match-details">You have all required skills + ${recommendedMatch}% of recommended skills</p>
                </div>
            </div>
        `;
        container.appendChild(jobDiv);
    });
}

// Event listeners
document.getElementById('jobForm').addEventListener('submit', postJob);
document.getElementById('candidateForm').addEventListener('submit', submitProfile);

// Allow Enter key to add requirements/skills
document.getElementById('requirement').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addRequirement();
    }
});

document.getElementById('skill').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
    }
});

// Initialize
renderRequirements();
renderSkills();
// initialize slider fill
const mm = document.getElementById('minimumMatch');
if (mm) updateMatchValue(mm.value);