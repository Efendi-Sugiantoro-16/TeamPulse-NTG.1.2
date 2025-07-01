/**
 * Feedback Page JavaScript
 * Handles feedback page functionality and form interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize feedback page
    initializeFeedback();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadFeedbackData();
});

function initializeFeedback() {
    console.log('Feedback page initialized');
    
    // Initialize form validation
    initializeFormValidation();
}

function setupEventListeners() {
    // Feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
    }
    
    // Form actions
    const saveDraftBtn = document.getElementById('saveDraft');
    const clearFormBtn = document.querySelector('button[type="reset"]');
    
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
    
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-actions button');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Feedback list actions
    const feedbackActions = document.querySelectorAll('.feedback-actions button');
    feedbackActions.forEach(button => {
        button.addEventListener('click', handleFeedbackAction);
    });
    
    // Header actions
    const refreshFeedbackBtn = document.getElementById('refreshFeedback');
    const filterFeedbackBtn = document.getElementById('filterFeedback');
    
    if (refreshFeedbackBtn) {
        refreshFeedbackBtn.addEventListener('click', refreshFeedback);
    }
    
    if (filterFeedbackBtn) {
        filterFeedbackBtn.addEventListener('click', showFilterModal);
    }
    
    // Form field changes
    const formFields = document.querySelectorAll('#feedbackForm input, #feedbackForm select, #feedbackForm textarea');
    formFields.forEach(field => {
        field.addEventListener('change', handleFormFieldChange);
        field.addEventListener('input', handleFormFieldChange);
    });
}

function loadFeedbackData() {
    // Simulate loading feedback data from API
    console.log('Loading feedback data...');
    
    // Update statistics
    updateFeedbackStatistics();
    
    // Update feedback list
    updateFeedbackList();
}

function initializeFormValidation() {
    const form = document.getElementById('feedbackForm');
    if (!form) return;
    
    // Real-time validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    if (isRequired && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function handleFeedbackSubmit(event) {
    event.preventDefault();
    
    // Validate form
    const form = event.target;
    const formData = new FormData(form);
    const feedbackData = Object.fromEntries(formData.entries());
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Submit feedback
    submitFeedback(feedbackData);
}

function submitFeedback(feedbackData) {
    console.log('Submitting feedback:', feedbackData);
    
    // Show loading state
    const submitBtn = document.querySelector('#feedbackForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Show success message
        showNotification('Feedback sent successfully!', 'success');
        
        // Reset form
        document.getElementById('feedbackForm').reset();
        
        // Refresh feedback list
        loadFeedbackData();
        
        // Clear any saved draft
        localStorage.removeItem('feedbackDraft');
        
    }, 2000);
}

function saveDraft() {
    const form = document.getElementById('feedbackForm');
    const formData = new FormData(form);
    const draftData = Object.fromEntries(formData.entries());
    
    // Save to localStorage
    localStorage.setItem('feedbackDraft', JSON.stringify(draftData));
    
    showNotification('Draft saved successfully', 'success');
}

function clearForm() {
    const form = document.getElementById('feedbackForm');
    form.reset();
    
    // Clear any saved draft
    localStorage.removeItem('feedbackDraft');
    
    // Clear field errors
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => clearFieldError(field));
    
    showNotification('Form cleared', 'info');
}

function handleQuickAction(event) {
    const button = event.target.closest('button');
    const action = button.id;
    
    console.log('Quick action:', action);
    
    switch(action) {
        case 'teamMeeting':
            scheduleTeamMeeting();
            break;
        case 'oneOnOne':
            requestOneOnOne();
            break;
        case 'anonymousFeedback':
            showAnonymousFeedback();
            break;
        case 'feedbackTemplate':
            showFeedbackTemplates();
            break;
        default:
            console.log('Unknown quick action:', action);
    }
}

function handleFeedbackAction(event) {
    const button = event.target.closest('button');
    const action = button.textContent.trim().toLowerCase();
    const feedbackItem = button.closest('.feedback-item');
    
    console.log('Feedback action:', action);
    
    switch(action) {
        case 'reply':
            replyToFeedback(feedbackItem);
            break;
        case 'like':
            likeFeedback(feedbackItem);
            break;
        case 'share':
            shareFeedback(feedbackItem);
            break;
        default:
            console.log('Unknown feedback action:', action);
    }
}

function handleFormFieldChange(event) {
    const field = event.target;
    const formData = new FormData(document.getElementById('feedbackForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Auto-save draft after 2 seconds of inactivity
    clearTimeout(window.draftTimeout);
    window.draftTimeout = setTimeout(() => {
        if (Object.values(data).some(value => value)) {
            localStorage.setItem('feedbackDraft', JSON.stringify(data));
            console.log('Draft auto-saved');
        }
    }, 2000);
}

function scheduleTeamMeeting() {
    showNotification('Opening team meeting scheduler...', 'info');
    
    // Simulate opening meeting scheduler
    setTimeout(() => {
        showNotification('Team meeting scheduler opened', 'success');
    }, 1000);
}

function requestOneOnOne() {
    showNotification('Requesting 1-on-1 meeting...', 'info');
    
    // Simulate 1-on-1 request
    setTimeout(() => {
        showNotification('1-on-1 request sent to team lead', 'success');
    }, 1500);
}

function showAnonymousFeedback() {
    showNotification('Opening anonymous feedback form...', 'info');
    
    // Simulate opening anonymous feedback
    setTimeout(() => {
        showNotification('Anonymous feedback form opened', 'success');
    }, 1000);
}

function showFeedbackTemplates() {
    showNotification('Loading feedback templates...', 'info');
    
    // Simulate loading templates
    setTimeout(() => {
        showNotification('Feedback templates loaded', 'success');
    }, 1000);
}

function replyToFeedback(feedbackItem) {
    const authorName = feedbackItem.querySelector('.author-name').textContent;
    const subject = feedbackItem.querySelector('h4').textContent;
    
    console.log('Replying to feedback from:', authorName);
    showNotification(`Opening reply to ${authorName}...`, 'info');
    
    // Simulate opening reply form
    setTimeout(() => {
        showNotification(`Reply form opened for: ${subject}`, 'success');
    }, 1000);
}

function likeFeedback(feedbackItem) {
    const likeBtn = feedbackItem.querySelector('.btn-outline');
    const isLiked = likeBtn.classList.contains('liked');
    
    if (isLiked) {
        likeBtn.classList.remove('liked');
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Like';
        showNotification('Feedback unliked', 'info');
    } else {
        likeBtn.classList.add('liked');
        likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Liked';
        showNotification('Feedback liked!', 'success');
    }
}

function shareFeedback(feedbackItem) {
    const subject = feedbackItem.querySelector('h4').textContent;
    
    console.log('Sharing feedback:', subject);
    showNotification('Opening share options...', 'info');
    
    // Simulate sharing options
    setTimeout(() => {
        showNotification(`Feedback shared: ${subject}`, 'success');
    }, 1000);
}

function refreshFeedback() {
    console.log('Refreshing feedback...');
    showNotification('Refreshing feedback data...', 'info');
    
    // Reload feedback data
    loadFeedbackData();
    
    setTimeout(() => {
        showNotification('Feedback data refreshed', 'success');
    }, 1000);
}

function showFilterModal() {
    showNotification('Opening feedback filters...', 'info');
    
    // Simulate filter modal
    setTimeout(() => {
        showNotification('Feedback filters opened', 'success');
    }, 1000);
}

function updateFeedbackStatistics() {
    // Update statistics display
    const stats = {
        totalFeedback: '156',
        positiveFeedback: '89%',
        responseTime: '2.3h',
        activeMembers: '12'
    };
    
    Object.keys(stats).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = stats[key];
        }
    });
}

function updateFeedbackList() {
    // This would typically fetch data from an API
    console.log('Updating feedback list...');
    
    // Simulate feedback list update
    const feedbackList = document.getElementById('feedbackList');
    if (feedbackList) {
        console.log('Feedback list updated');
    }
}

// Load saved draft on page load
function loadSavedDraft() {
    const savedDraft = localStorage.getItem('feedbackDraft');
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            const form = document.getElementById('feedbackForm');
            
            Object.keys(draftData).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = draftData[key];
                }
            });
            
            showNotification('Draft loaded successfully', 'info');
        } catch (error) {
            console.error('Error loading draft:', error);
            localStorage.removeItem('feedbackDraft');
        }
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Load saved draft when page loads
loadSavedDraft();
