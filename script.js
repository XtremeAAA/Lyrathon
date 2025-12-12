// Data storage
let jobs = [];
let candidates = [];
let currentRequirements = [];
let currentSkills = [];

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
}

// Add requirement
function addRequirement() {
    const input = document.getElementById('requirement');
    const requirement = input.value.trim();

    if (requirement) {
        currentRequirements.push(requirement);
        input.value = '';
        renderRequirements();
    }
}

// Remove requirement
function removeRequirement(index) {
    currentRequirements.splice(index, 1);
    renderRequirements();
}

// Render requirements
function renderRequirements() {
    const container = document.getElementById('requirementsList');
    container.innerHTML = '';

    currentRequirements.forEach((req, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            ${req}
            <button class="tag-remove" onclick="removeRequirement(${index})">✕</button>
        `;
        container.appendChild(tag);
    });
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

// Calculate match percentage
function calculateMatch(jobRequirements, candidateSkills) {
    if (jobRequirements.length === 0) return 0;

    let matches = 0;
    jobRequirements.forEach(req => {
        const reqLower = req.toLowerCase();
        candidateSkills.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (skillLower.includes(reqLower) || reqLower.includes(skillLower)) {
                matches++;
            }
        });
    });

    // Avoid counting same requirement multiple times
    matches = Math.min(matches, jobRequirements.length);
    return (matches / jobRequirements.length) * 100;
}

// Get qualified candidates for a job
function getQualifiedCandidates(job) {
    return candidates.filter(candidate => {
        const matchPercentage = calculateMatch(job.requirements, candidate.skills);
        return matchPercentage >= job.minimumMatch;
    });
}

// Get visible jobs for a candidate
function getVisibleJobs(candidate) {
    return jobs.filter(job => {
        const matchPercentage = calculateMatch(job.requirements, candidate.skills);
        return matchPercentage >= job.minimumMatch;
    });
}

// Post job
function postJob(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value.trim();
    const company = document.getElementById('companyName').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    const minimumMatch = parseInt(document.getElementById('minimumMatch').value);

    if (!title || !company || currentRequirements.length === 0) {
        alert('Please fill in all required fields and add at least one requirement');
        return;
    }

    const job = {
        id: Date.now(),
        title,
        company,
        description,
        requirements: [...currentRequirements],
        minimumMatch
    };

    jobs.push(job);

    // Reset form
    document.getElementById('jobForm').reset();
    currentRequirements = [];
    renderRequirements();
    document.getElementById('minimumMatch').value = 50;
    updateMatchValue(50);

    // Update displays
    renderJobs();
    renderMatchedJobs();

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
        const qualifiedCount = getQualifiedCandidates(job).length;

        const jobDiv = document.createElement('div');
        jobDiv.className = 'job-item';
        jobDiv.innerHTML = `
            <h3 class="job-title">${job.title}</h3>
            <p class="job-company">${job.company}</p>
            <p class="job-description">${job.description}</p>
            <div>
                <p class="job-requirements-label">Requirements:</p>
                <div class="job-requirements">
                    ${job.requirements.map(req => `<span class="requirement-tag">${req}</span>`).join('')}
                </div>
            </div>
            <div class="job-footer">
                <p class="qualified-count">${qualifiedCount} qualified candidate(s) can see this job</p>
                <p class="minimum-match">Minimum match: ${job.minimumMatch}%</p>
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

    const candidate = {
        id: Date.now(),
        name,
        email,
        experience,
        skills: [...currentSkills]
    };

    candidates.push(candidate);

    // Reset form
    document.getElementById('candidateForm').reset();
    currentSkills = [];
    renderSkills();

    // Update displays
    renderMatchedJobs();
    renderJobs();

    alert('Profile created successfully!');
}

// Render matched jobs for candidates
function renderMatchedJobs() {
    const container = document.getElementById('matchedJobsList');
    
    if (candidates.length === 0) {
        container.innerHTML = '<p class="empty-state">Create your profile to see matched jobs</p>';
        return;
    }

    container.innerHTML = '';

    candidates.forEach(candidate => {
        const visibleJobs = getVisibleJobs(candidate);

        const candidateDiv = document.createElement('div');
        candidateDiv.className = 'candidate-section';

        let jobsHTML = '';
        if (visibleJobs.length === 0) {
            jobsHTML = '<p class="no-matches">No jobs match your qualifications yet</p>';
        } else {
            jobsHTML = visibleJobs.map(job => {
                const matchPercentage = Math.round(calculateMatch(job.requirements, candidate.skills));
                return `
                    <div class="matched-job">
                        <h4 class="job-title">${job.title}</h4>
                        <p class="job-company">${job.company}</p>
                        <p class="job-description">${job.description}</p>
                        <div class="match-indicator">
                            <span style="color: #10b981;">✓</span>
                            <span class="match-percentage">${matchPercentage}% Match</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        candidateDiv.innerHTML = `
            <h3 class="candidate-name">${candidate.name}'s Matches</h3>
            ${jobsHTML}
        `;
        
        container.appendChild(candidateDiv);
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