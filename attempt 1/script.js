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

// Format timestamp into readable local date/time
function formatDateTime(ts) {
    if (!ts) return '';
    try {
        const d = new Date(ts);
        return d.toLocaleString();
    } catch (e) {
        return '';
    }
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

    const requiredRepos = parseInt(document.getElementById('jobRequiredRepos')?.value || 0, 10);

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
            jobs[jobIndex].requiredRepos = requiredRepos;
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
            minYears: minYears,
            requiredRepos: requiredRepos,
            applications: [], // holds { candidateId, repos: [], status: 'pending'|'accepted'|'rejected', appliedAt }
            postedAt: Date.now()
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
        // use job.applications to determine applicants who submitted required repos
        const jobAppsAll = job.applications || [];
        const applicantsFiltered = jobAppsAll.filter(a => (a.repos && a.repos.length >= (job.requiredRepos || 0)));

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
            <h3 class="job-title">${job.title} ${applicantsFiltered.length ? '<span class="app-count-badge">' + applicantsFiltered.length + '</span>' : ''}</h3>
            <button class="job-edit-btn" onclick="openJobModalForEdit(${job.id})">Edit</button>
                <p class="job-company">${job.company}</p>
                <p class="job-experience">${job.minYears ? 'Min ' + job.minYears + ' yrs' : 'Experience: Any'}</p>
                <p class="job-posted">Posted: ${formatDateTime(job.postedAt)}</p>
            <p class="job-description">${job.description}</p>
            ${requiredHTML}
            ${recommendedHTML}
            <div class="job-footer">
                <p class="qualified-count">${qualifiedCount} qualified candidate(s) can see this job</p>
                <p class="minimum-match">Candidates must have ALL required skills + ${job.minimumMatch}% of recommended skills</p>
            </div>
            <div class="applicants-list">
                <p class="job-requirements-label">Applicants:</p>
                ${applicantsFiltered.length === 0 ? '<p class="no-matches">No applicants yet</p>' : applicantsFiltered.map(app => {
                    const cand = candidates.find(c => c.id === app.candidateId) || { name: 'Unknown', email: '' };
                    return `
                    <div class="applicant-item" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.5rem;">
                                <div>
                                    <p style="font-weight:700; margin-bottom:0.25rem;">${cand.name}</p>
                                    <p style="font-size:0.875rem; color:#6b7280; margin:0;">${cand.email} • ${cand.years || ''} yrs</p>
                                    <p style="font-size:0.75rem; color:#9ca3af; margin:0;">Applied: ${formatDateTime(app.appliedAt)}</p>
                                </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <span class="app-status ${app.status}">${app.status}</span>
                            <button class="btn-secondary" onclick="openApplicantModal(${cand.id}, ${job.id})">View</button>
                            <button class="btn-accept" onclick="acceptApplication(${cand.id}, ${job.id})">Accept</button>
                            <button class="btn-reject" onclick="rejectApplication(${cand.id}, ${job.id})">Reject</button>
                        </div>
                    </div>
                `}).join('')}
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
    if (document.getElementById('jobRequiredRepos')) document.getElementById('jobRequiredRepos').value = job.requiredRepos || 0;
    updateMatchValue(document.getElementById('minimumMatch').value);

    currentRequiredSkills = [...(job.requiredSkills || [])];
    currentRecommendedSkills = [...(job.recommendedSkills || [])];
    renderRequirements();

    document.getElementById('jobModalOverlay').classList.add('active');
    document.getElementById('jobModalOverlay').setAttribute('aria-hidden', 'false');
}

// Company: open applicant details modal
function openApplicantModal(candidateId, jobId) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    document.getElementById('applicantName').textContent = candidate.name || '';
    document.getElementById('applicantEmail').textContent = candidate.email || '';
    document.getElementById('applicantYears').textContent = candidate.years != null ? (candidate.years + ' yrs') : '';
    document.getElementById('applicantExperience').textContent = candidate.experience || '';

    const skillsContainer = document.getElementById('applicantSkills');
    skillsContainer.innerHTML = '';
    (candidate.skills || []).forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'tag tag-skill';
        tag.textContent = skill;
        skillsContainer.appendChild(tag);
    });

    // repos submitted for this job
    const reposContainer = document.getElementById('applicantRepos');
    reposContainer.innerHTML = '';
    const repos = (candidate.matches && candidate.matches[jobId]) ? candidate.matches[jobId] : [];
    if (repos.length === 0) {
        reposContainer.innerHTML = '<p class="no-matches">No repositories submitted</p>';
    } else {
        repos.forEach(link => {
            const a = document.createElement('a');
            a.href = link;
            a.target = '_blank';
            a.textContent = link;
            const div = document.createElement('div');
            div.appendChild(a);
            reposContainer.appendChild(div);
        });
    }

    // show submitted at timestamp
    const submittedAtEl = document.getElementById('applicantSubmittedAt');
    const job = jobs.find(j => j.id === jobId);
    const appRecord = job && job.applications ? job.applications.find(a => a.candidateId === candidateId) : null;
    if (submittedAtEl) {
        submittedAtEl.textContent = appRecord && appRecord.appliedAt ? formatDateTime(appRecord.appliedAt) : (repos.length ? 'Unknown time' : 'No submission');
    }

    // show status and action buttons
    const actionContainer = document.getElementById('applicantActionButtons');
    if (actionContainer) {
        const job = jobs.find(j => j.id === jobId);
        const app = job && job.applications ? job.applications.find(a => a.candidateId === candidateId) : null;
        const status = app ? app.status : 'pending';
        actionContainer.innerHTML = '';
        const statusSpan = document.createElement('span');
        statusSpan.className = 'app-status ' + status;
        statusSpan.textContent = status;
        actionContainer.appendChild(statusSpan);

        // Accept / Reject buttons (only show when pending)
        if (status === 'pending') {
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'btn-accept';
            acceptBtn.textContent = 'Accept';
            acceptBtn.onclick = function() { acceptApplication(candidateId, jobId); closeApplicantModal(); };
            actionContainer.appendChild(acceptBtn);

            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'btn-reject';
            rejectBtn.textContent = 'Reject';
            rejectBtn.onclick = function() { rejectApplication(candidateId, jobId); closeApplicantModal(); };
            actionContainer.appendChild(rejectBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn-secondary';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = closeApplicantModal;
        actionContainer.appendChild(closeBtn);
    }

    document.getElementById('applicantModalOverlay').classList.add('active');
    document.getElementById('applicantModalOverlay').setAttribute('aria-hidden', 'false');
}

function closeApplicantModal() {
    document.getElementById('applicantModalOverlay').classList.remove('active');
    document.getElementById('applicantModalOverlay').setAttribute('aria-hidden', 'true');
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

        // check if currentCandidate already submitted repos for this job
        const submitted = (currentCandidate.matches && currentCandidate.matches[job.id]);

        jobDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 class="job-title">${job.title}</h4>
                    <p class="job-company">${job.company}</p>
                </div>
                <div>
                    ${submitted ? '<span class="submitted-label">Repos Submitted</span>' : `<button class="btn-match" onclick="openMatchModal(${job.id})">Match</button>`}
                </div>
            </div>
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
            ${submitted ? `<div style="margin-top:0.75rem;"><p class="job-requirements-label">Submitted Repositories:</p>${currentCandidate.matches[job.id].map(link=>`<div><a href="${link}" target="_blank">${link}</a></div>`).join('')}</div>` : ''}
        `;

        container.appendChild(jobDiv);
    });
}

// Match modal handlers
function openMatchModal(jobId) {
    if (!currentCandidate) {
        alert('Create your profile first to submit repositories.');
        return;
    }
    document.getElementById('matchJobId').value = jobId;
    // prefill if already submitted
    const job = jobs.find(j => j.id === jobId) || { requiredRepos: 0 };
    const required = job.requiredRepos || 0;

    // clear and prefill up to 5 inputs
    const links = (currentCandidate.matches && currentCandidate.matches[jobId]) ? currentCandidate.matches[jobId] : [];

    // determine how many inputs to show: if job requires N (>0) show N inputs; otherwise show up to 5
    let displayCount = required > 0 ? required : 5;
    // if candidate already submitted more links than required, show them
    displayCount = Math.max(displayCount, links.length);
    displayCount = Math.min(displayCount, 5);

    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById('repo' + i);
        if (!el) continue;
        el.value = links[i - 1] || '';
        // enforce required attribute for the number required by job
        el.required = i <= required;
        // show/hide based on displayCount
        const wrapper = el.closest('.form-group');
        if (wrapper) wrapper.style.display = (i <= displayCount) ? '' : 'none';
        else el.style.display = (i <= displayCount) ? '' : 'none';
    }
    // store required count in a data attribute so submit handler can reference easily
    document.getElementById('matchForm').dataset.requiredRepos = required;
    document.getElementById('matchModalOverlay').classList.add('active');
    document.getElementById('matchModalOverlay').setAttribute('aria-hidden', 'false');
}

function closeMatchModal() {
    document.getElementById('matchModalOverlay').classList.remove('active');
    document.getElementById('matchModalOverlay').setAttribute('aria-hidden', 'true');
}

function submitMatch(e) {
    e.preventDefault();
    if (!currentCandidate) {
        alert('Create your profile first to submit repositories.');
        return;
    }

    const jobId = parseInt(document.getElementById('matchJobId').value, 10);
    // collect up to 5 repo inputs
    const urls = [];
    const urlPattern = /^(https?:\/\/)/i;
    for (let i = 1; i <= 5; i++) {
        const el = document.getElementById('repo' + i);
        if (!el) continue;
        const v = el.value.trim();
        if (v) {
            if (!urlPattern.test(v)) {
                alert('Please provide valid URLs (must start with http:// or https://).');
                return;
            }
            urls.push(v);
        }
    }

    // required number enforced by job setting
    const requiredCount = parseInt(document.getElementById('matchForm').dataset.requiredRepos || 0, 10);
    if (urls.length < requiredCount) {
        alert(`This job requires at least ${requiredCount} repository link(s). Please provide ${requiredCount} or more.`);
        return;
    }

    // store in currentCandidate and in candidates array (store only submitted links)
    if (!currentCandidate.matches) currentCandidate.matches = {};
    currentCandidate.matches[jobId] = urls;

    // update candidates array entry
    const idx = candidates.findIndex(c => c.id === currentCandidate.id);
    if (idx !== -1) candidates[idx] = currentCandidate;

    // also register/update an application record on the job
    const job = jobs.find(j => j.id === jobId);
    if (job) {
        if (!job.applications) job.applications = [];
        const existing = job.applications.find(a => a.candidateId === currentCandidate.id);
        if (existing) {
            existing.repos = urls;
            existing.status = 'pending';
            existing.appliedAt = Date.now();
        } else {
            job.applications.push({ candidateId: currentCandidate.id, repos: urls, status: 'pending', appliedAt: Date.now() });
        }
    }

    closeMatchModal();
    renderMatchedJobs();
    renderJobs();
    alert('Repositories submitted successfully.');
}

// Accept / Reject handlers for applications
function acceptApplication(candidateId, jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.applications) return;
    const app = job.applications.find(a => a.candidateId === candidateId);
    if (!app) return;
    app.status = 'accepted';
    app.decisionAt = Date.now();
    renderJobs();
    alert('Applicant accepted.');
}

function rejectApplication(candidateId, jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.applications) return;
    const app = job.applications.find(a => a.candidateId === candidateId);
    if (!app) return;
    app.status = 'rejected';
    app.decisionAt = Date.now();
    renderJobs();
    alert('Applicant rejected.');
}


// Event listeners
document.getElementById('jobForm').addEventListener('submit', postJob);
document.getElementById('candidateForm').addEventListener('submit', submitProfile);
document.getElementById('matchForm').addEventListener('submit', submitMatch);

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