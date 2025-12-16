/**
 * PrivacyLens Popup Script
 * 
 * Handles UI interactions and displays scan results.
 * Manages all popup UI updates, data loading, and user interactions.
 */

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('PrivacyLens popup loaded');
  
  // Request current tab URL from background script
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentTab' });
    
    if (response && response.url) {
      displayCurrentUrl(response.url);
      // Load and display third-party request count
      await loadThirdPartyCount();
      // Load and display cookie count
      await loadCookieCount();
      // Load and display tracker information
      await loadTrackers();
      // Load and display risk level
      await loadRiskLevel();
      // Load and display threats
      await loadThreats();
      // Load and display data security
      await loadDataSecurity();
      // Load and display data collection
      await loadDataCollection();
      // Check policy claims
      await checkPolicyClaims();
    } else {
      displayError('Unable to detect current tab');
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
    displayError('Error loading tab information');
  }
  
  // Refresh count periodically while popup is open
  setInterval(async () => {
    await loadThirdPartyCount();
    await loadCookieCount();
    await loadTrackers();
    await loadRiskLevel();
    await loadThreats();
    await loadDataSecurity();
    await loadDataCollection();
    await checkPolicyClaims();
  }, 1000); // Update every second
  
  // Set up analyze button
  const analyzeButton = document.getElementById('analyzePolicyButton');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', analyzePrivacyPolicy);
  }
});

// Display the current URL in the popup
function displayCurrentUrl(url) {
  const urlDisplay = document.getElementById('urlDisplay');
  if (urlDisplay) {
    // Display the short/root domain instead of full URL
    try {
      const domain = (new URL(url)).hostname.replace(/^www\./, '');
      urlDisplay.textContent = `Scanning: ${domain}`;
    } catch (e) {
      urlDisplay.textContent = `Scanning: ${url}`;
    }
  }
}

// Load and display third-party request count
async function loadThirdPartyCount() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getThirdPartyCount' });
    if (response && response.count !== undefined) {
      displayThirdPartyCount(response.count);
    }
  } catch (error) {
    console.error('Error getting third-party count:', error);
  }
}

// Display third-party request count
function displayThirdPartyCount(count) {
  const countDisplay = document.getElementById('thirdPartyCount');
  if (countDisplay) {
    // Update the number in the card
    const numberElement = countDisplay.querySelector('.text-lg');
    if (numberElement) {
      numberElement.textContent = count;
    }
  }
}

// Load and display cookie count
async function loadCookieCount() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCookies' });
    if (response && response.count !== undefined) {
      displayCookieCount(response.count);
    }
  } catch (error) {
    console.error('Error getting cookie count:', error);
  }
}

// Display cookie count
function displayCookieCount(count) {
  const countDisplay = document.getElementById('cookieCount');
  if (countDisplay) {
    // Update the number in the card
    const numberElement = countDisplay.querySelector('.text-lg');
    if (numberElement) {
      numberElement.textContent = count;
    }
  }
}

// Load and display tracker information
async function loadTrackers() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTrackers' });
    if (response && response.trackers) {
      displayTrackers(response.trackers);
    }
  } catch (error) {
    console.error('Error getting trackers:', error);
  }
}

// Display tracker information
function displayTrackers(trackerData) {
  const trackerDisplay = document.getElementById('trackerCount');
  const trackerCategories = document.getElementById('trackerCategories');
  
  if (trackerDisplay) {
    const count = trackerData.total || 0;
    // Update the number in the card
    const numberElement = trackerDisplay.querySelector('.text-lg');
    if (numberElement) {
      numberElement.textContent = count;
    }
  }
  
  if (trackerCategories && trackerData.byCategory) {
    const categories = Object.keys(trackerData.byCategory);
    if (categories.length > 0) {
      const categoryText = categories.map(cat => {
        const count = trackerData.byCategory[cat].length;
        return `${cat} (${count})`;
      }).join(', ');
      trackerCategories.textContent = categoryText;
      trackerCategories.style.display = 'block';
    } else {
      trackerCategories.style.display = 'none';
    }
  }
}

// Load and display risk level
async function loadRiskLevel() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRiskLevel' });
    if (response && response.riskLevel) {
      displayRiskLevel(response.riskLevel);
    }
  } catch (error) {
    console.error('Error getting risk level:', error);
  }
}

// Display risk level badge
function displayRiskLevel(riskData) {
  const riskBadge = document.getElementById('riskBadge');
  const threatScoreDisplay = document.getElementById('threatScoreDisplay');
  const threatBreakdown = document.getElementById('threatBreakdown');
  
  if (!riskBadge) return;
  
  // Update text
  const threatScore = riskData.threatScore || 0;
  riskBadge.textContent = `${riskData.label || 'Unknown'} (Score: ${threatScore})`;
  
  // Update color classes
  riskBadge.className = 'w-full text-center py-2 rounded-lg text-white text-lg font-semibold';
  
  // Add color based on risk level
  if (riskData.color === 'green') {
    riskBadge.classList.add('bg-green-500');
  } else if (riskData.color === 'orange' || riskData.color === 'yellow') {
    riskBadge.classList.add('bg-orange-500');
  } else if (riskData.color === 'red') {
    riskBadge.classList.add('bg-red-600');
  } else {
    riskBadge.classList.add('bg-gray-500');
  }
  
  // Display threat score breakdown
  const threatScoreSection = document.getElementById('threatScoreSection');
  if (threatScoreSection) {
    if (threatScoreDisplay) {
      threatScoreDisplay.textContent = `Threat Score: ${threatScore}`;
    }
    
    if (threatBreakdown && riskData.breakdown) {
      const breakdownItems = [];
      const breakdown = riskData.breakdown;
      
      if (breakdown.maliciousDomains) {
        breakdownItems.push(`Malicious Domains: +${breakdown.maliciousDomains.points} (${breakdown.maliciousDomains.count})`);
      }
      if (breakdown.cryptoMining) {
        breakdownItems.push(`Crypto Mining: +${breakdown.cryptoMining.points}`);
      }
      if (breakdown.formHijacking) {
        breakdownItems.push(`Form Hijacking: +${breakdown.formHijacking.points} (${breakdown.formHijacking.count})`);
      }
      if (breakdown.dataExfiltration) {
        breakdownItems.push(`Data Exfiltration: +${breakdown.dataExfiltration.points} (${breakdown.dataExfiltration.count})`);
      }
      if (breakdown.trackers) {
        breakdownItems.push(`Trackers: +${breakdown.trackers.points} (${breakdown.trackers.count})`);
      }
      if (breakdown.thirdPartyRequests) {
        breakdownItems.push(`Third-Party Requests: +${breakdown.thirdPartyRequests.points} (${breakdown.thirdPartyRequests.count})`);
      }
      
      if (breakdownItems.length > 0) {
        threatBreakdown.innerHTML = breakdownItems.map(item => `<li class="text-xs text-gray-600">${item}</li>`).join('');
        threatScoreSection.style.display = 'block';
      } else {
        threatScoreSection.style.display = 'none';
      }
    } else {
      threatScoreSection.style.display = 'none';
    }
  }
}

// Analyze privacy policy
async function analyzePrivacyPolicy() {
  const analyzeButton = document.getElementById('analyzePolicyButton');
  const analysisResults = document.getElementById('analysisResults');
  const analysisLoading = document.getElementById('analysisLoading');
  const analysisError = document.getElementById('analysisError');
  
  // Show loading state
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = 'Analyzing...';
  }
  if (analysisLoading) {
    analysisLoading.style.display = 'block';
  }
  if (analysisResults) {
    analysisResults.style.display = 'none';
  }
  if (analysisError) {
    analysisError.style.display = 'none';
  }
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'analyzePrivacyPolicy' });
    
    // Hide loading
    if (analysisLoading) {
      analysisLoading.style.display = 'none';
    }
    
    if (response.error) {
      // Show error
      if (analysisError) {
        analysisError.textContent = response.error;
        analysisError.style.display = 'block';
      }
    } else if (response.analysis) {
      // Display results
      displayAnalysisResults(response);
      if (analysisResults) {
        analysisResults.style.display = 'block';
      }
    }
  } catch (error) {
    console.error('Error analyzing privacy policy:', error);
    if (analysisError) {
      analysisError.textContent = 'Failed to analyze privacy policy. Please try again.';
      analysisError.style.display = 'block';
    }
    if (analysisLoading) {
      analysisLoading.style.display = 'none';
    }
  } finally {
    // Reset button
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = 'Analyze Privacy Policy';
    }
  }
}

// Display analysis results
function displayAnalysisResults(response) {
  const analysis = response.analysis || {};
  
  // Data Collected
  const dataCollectedEl = document.getElementById('dataCollected');
  if (dataCollectedEl && analysis.dataCollected) {
    const items = Array.isArray(analysis.dataCollected) 
      ? analysis.dataCollected 
      : [analysis.dataCollected];
    dataCollectedEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // Third-Party Sharing
  const thirdPartyEl = document.getElementById('thirdPartySharing');
  if (thirdPartyEl && analysis.thirdPartySharing) {
    const items = Array.isArray(analysis.thirdPartySharing) 
      ? analysis.thirdPartySharing 
      : [analysis.thirdPartySharing];
    thirdPartyEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // User Rights
  const userRightsEl = document.getElementById('userRights');
  if (userRightsEl && analysis.userRights) {
    const items = Array.isArray(analysis.userRights) 
      ? analysis.userRights 
      : [analysis.userRights];
    userRightsEl.innerHTML = items.map(item => `<li>${item}</li>`).join('');
  }
  
  // Risky Behaviors
  const riskyBehaviorsEl = document.getElementById('riskyBehaviors');
  if (riskyBehaviorsEl && analysis.riskyBehaviors) {
    const items = Array.isArray(analysis.riskyBehaviors) 
      ? analysis.riskyBehaviors 
      : [analysis.riskyBehaviors];
    riskyBehaviorsEl.innerHTML = items.map(item => `<li class="text-red-600">${item}</li>`).join('');
  }
  
  // Show cached indicator if applicable
  if (response.cached) {
    const cachedIndicator = document.getElementById('cachedIndicator');
    if (cachedIndicator) {
      cachedIndicator.style.display = 'block';
    }
  }
}

// Load and display threats
async function loadThreats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getThreats' });
    if (response && response.threats) {
      displayThreats(response.threats);
    }
  } catch (error) {
    console.error('Error getting threats:', error);
  }
}

// Display threats
function displayThreats(threatData) {
  const threatsSection = document.getElementById('threatsSection');
  const maliciousDomainsList = document.getElementById('maliciousDomainsList');
  const cryptoMiningStatus = document.getElementById('cryptoMiningStatus');
  const threatsCount = document.getElementById('threatsCount');
  
  if (!threatsSection) return;
  
  const maliciousCount = threatData.maliciousDomainCount || 0;
  const hasCryptoMining = threatData.cryptoMining || false;
  const totalThreats = maliciousCount + (hasCryptoMining ? 1 : 0);
  
  // Show/hide section based on threats
  if (totalThreats > 0) {
    threatsSection.style.display = 'block';
    
    // Update count
    if (threatsCount) {
      threatsCount.textContent = `${totalThreats} threat${totalThreats !== 1 ? 's' : ''} detected`;
    }
    
    // Update malicious domains list with timestamps
    if (maliciousDomainsList) {
      if (maliciousCount > 0) {
        const domains = Array.isArray(threatData.maliciousDomains) ? threatData.maliciousDomains : [];
        maliciousDomainsList.innerHTML = domains.map(item => {
          const domain = typeof item === 'string' ? item : item.domain;
          const timestamp = typeof item === 'object' && item.timestamp 
            ? ` (${new Date(item.timestamp).toLocaleTimeString()})`
            : '';
          return `<li class="text-red-700">${domain}${timestamp}</li>`;
        }).join('');
        maliciousDomainsList.parentElement.style.display = 'block';
      } else {
        maliciousDomainsList.parentElement.style.display = 'none';
      }
    }
    
    // Update crypto mining status with timestamp
    if (cryptoMiningStatus) {
      if (hasCryptoMining) {
        const timestamp = threatData.cryptoMiningTimestamp 
          ? ` (${new Date(threatData.cryptoMiningTimestamp).toLocaleTimeString()})`
          : '';
        cryptoMiningStatus.textContent = `Yes - Cryptocurrency mining detected${timestamp}`;
        cryptoMiningStatus.classList.add('text-red-700');
        cryptoMiningStatus.parentElement.style.display = 'block';
      } else {
        cryptoMiningStatus.textContent = 'No';
        cryptoMiningStatus.classList.remove('text-red-700');
        cryptoMiningStatus.parentElement.style.display = 'none';
      }
    }
  } else {
    threatsSection.style.display = 'none';
  }
}

// Load and display data security information
async function loadDataSecurity() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getDataSecurity' });
    if (response && response.dataSecurity) {
      displayDataSecurity(response.dataSecurity);
    }
  } catch (error) {
    console.error('Error getting data security:', error);
  }
}

// Display data security information
function displayDataSecurity(dataSecurity) {
  const dataSecuritySection = document.getElementById('dataSecuritySection');
  const formHijackingStatus = document.getElementById('formHijackingStatus');
  const formHijackingList = document.getElementById('formHijackingList');
  const dataExfiltrationStatus = document.getElementById('dataExfiltrationStatus');
  const dataExfiltrationList = document.getElementById('dataExfiltrationList');
  
  if (!dataSecuritySection) return;
  
  const formHijacking = dataSecurity.formHijacking || [];
  const dataExfiltration = dataSecurity.dataExfiltration || [];
  const hasIssues = formHijacking.length > 0 || dataExfiltration.length > 0;
  
  // Show/hide section based on issues
  if (hasIssues) {
    dataSecuritySection.style.display = 'block';
    
    // Form hijacking display
    if (formHijacking.length > 0) {
      if (formHijackingStatus) {
        formHijackingStatus.textContent = `Yes - ${formHijacking.length} form${formHijacking.length !== 1 ? 's' : ''} submitting to third parties`;
        formHijackingStatus.classList.add('text-red-700');
        formHijackingStatus.parentElement.style.display = 'block';
      }
      
      if (formHijackingList) {
        formHijackingList.innerHTML = formHijacking.map(event => {
          const fields = event.sensitiveFields.length > 0 
            ? ` (${event.sensitiveFields.join(', ')})` 
            : '';
          const timestamp = event.timestamp 
            ? ` (${new Date(event.timestamp).toLocaleTimeString()})`
            : '';
          return `<li class="text-red-700">${event.domain}${fields}${timestamp}</li>`;
        }).join('');
        formHijackingList.parentElement.style.display = 'block';
      }
    } else {
      if (formHijackingStatus) {
        formHijackingStatus.textContent = 'No';
        formHijackingStatus.classList.remove('text-red-700');
        formHijackingStatus.parentElement.style.display = 'none';
      }
      if (formHijackingList) {
        formHijackingList.parentElement.style.display = 'none';
      }
    }
    
    // Data exfiltration display
    if (dataExfiltration.length > 0) {
      if (dataExfiltrationStatus) {
        dataExfiltrationStatus.textContent = `Yes - ${dataExfiltration.length} incident${dataExfiltration.length !== 1 ? 's' : ''} detected`;
        dataExfiltrationStatus.classList.add('text-red-700');
        dataExfiltrationStatus.parentElement.style.display = 'block';
      }
      
      if (dataExfiltrationList) {
        dataExfiltrationList.innerHTML = dataExfiltration.map(event => {
          const size = event.size > 1024 
            ? ` (${(event.size / 1024).toFixed(1)}KB)` 
            : '';
          const timestamp = event.timestamp 
            ? ` (${new Date(event.timestamp).toLocaleTimeString()})`
            : '';
          return `<li class="text-red-700">${event.domain}: ${event.dataType}${size}${timestamp}</li>`;
        }).join('');
        dataExfiltrationList.parentElement.style.display = 'block';
      }
    } else {
      if (dataExfiltrationStatus) {
        dataExfiltrationStatus.textContent = 'No';
        dataExfiltrationStatus.classList.remove('text-red-700');
        dataExfiltrationStatus.parentElement.style.display = 'none';
      }
      if (dataExfiltrationList) {
        dataExfiltrationList.parentElement.style.display = 'none';
      }
    }
  } else {
    dataSecuritySection.style.display = 'none';
  }
}

// Load data collection information
async function loadDataCollection() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getDataCollection' });
    if (response && response.dataCollection) {
      displayDataCollection(response.dataCollection);
    }
  } catch (error) {
    console.error('Error getting data collection:', error);
  }
}

// Display data collection information
function displayDataCollection(dataCollection) {
  const dataCollectionSection = document.getElementById('dataCollectionSection');
  const dataSharedSection = document.getElementById('dataSharedSection');
  
  if (!dataCollectionSection || !dataSharedSection) return;
  
  const { personalInfo, behavioralData, formData, threats } = dataCollection;
  const hasData = personalInfo.totalCount > 0 || behavioralData.totalRequests > 0 || formData.totalForms > 0;
  
  // Show/hide Data Being Collected section
  if (hasData) {
    dataCollectionSection.style.display = 'block';
    
    // Display Personal Information
    const personalInfoList = document.getElementById('personalInfoList');
    if (personalInfoList) {
      if (personalInfo.domains.length > 0) {
        personalInfoList.innerHTML = personalInfo.domains.map(item => {
          const types = item.types.join(', ');
          const timeStr = item.timestamps.length > 0 
            ? ` (${new Date(Math.min(...item.timestamps)).toLocaleTimeString()})`
            : '';
          return `<div class="mb-1">${item.domain}: ${types} (${item.count} event${item.count !== 1 ? 's' : ''})${timeStr}</div>`;
        }).join('');
      } else {
        personalInfoList.innerHTML = '<div class="text-gray-500">No personal information detected</div>';
      }
    }
    
    // Display Behavioral Data
    const behavioralDataList = document.getElementById('behavioralDataList');
    if (behavioralDataList) {
      if (behavioralData.domains.length > 0) {
        behavioralDataList.innerHTML = behavioralData.domains.map(item => {
          const categories = item.categories.length > 0 ? ` (${item.categories.join(', ')})` : '';
          return `<div class="mb-1">${item.domain}: ${item.requestCount} request${item.requestCount !== 1 ? 's' : ''}${categories}</div>`;
        }).join('');
      } else {
        behavioralDataList.innerHTML = '<div class="text-gray-500">No behavioral tracking detected</div>';
      }
    }
    
    // Display Form Data
    const formDataList = document.getElementById('formDataList');
    if (formDataList) {
      if (formData.domains.length > 0) {
        formDataList.innerHTML = formData.domains.map(item => {
          const fields = item.fields.join(', ');
          const timeStr = item.timestamps.length > 0 
            ? ` (${new Date(Math.min(...item.timestamps)).toLocaleTimeString()})`
            : '';
          return `<div class="mb-1">${item.domain}: ${fields} (${item.count} form${item.count !== 1 ? 's' : ''})${timeStr}</div>`;
        }).join('');
      } else {
        formDataList.innerHTML = '<div class="text-gray-500">No form data detected</div>';
      }
    }
  } else {
    dataCollectionSection.style.display = 'none';
  }
  
  // Display Data Shared With section
  // Aggregate all domains that receive data
  const sharedDomains = new Map();
  
  // Add personal info domains
  personalInfo.domains.forEach(item => {
    if (!sharedDomains.has(item.domain)) {
      sharedDomains.set(item.domain, { types: [], count: 0 });
    }
    const domainData = sharedDomains.get(item.domain);
    item.types.forEach(type => {
      if (!domainData.types.includes(type)) domainData.types.push(type);
    });
    domainData.count += item.count;
  });
  
  // Add behavioral data domains
  behavioralData.domains.forEach(item => {
    if (!sharedDomains.has(item.domain)) {
      sharedDomains.set(item.domain, { types: [], count: 0 });
    }
    const domainData = sharedDomains.get(item.domain);
    if (!domainData.types.includes('tracking')) domainData.types.push('tracking');
    domainData.count += item.requestCount;
  });
  
  // Add form data domains
  formData.domains.forEach(item => {
    if (!sharedDomains.has(item.domain)) {
      sharedDomains.set(item.domain, { types: [], count: 0 });
    }
    const domainData = sharedDomains.get(item.domain);
    item.fields.forEach(field => {
      if (!domainData.types.includes(field)) domainData.types.push(field);
    });
    domainData.count += item.count;
  });
  
  const dataSharedList = document.getElementById('dataSharedList');
  const dataSharedMore = document.getElementById('dataSharedMore');
  const dataSharedAll = document.getElementById('dataSharedAll');
  
  if (dataSharedList && sharedDomains.size > 0) {
    dataSharedSection.style.display = 'block';
    
    // Sort domains by count (descending)
    const sortedDomains = Array.from(sharedDomains.entries())
      .sort((a, b) => b[1].count - a[1].count);
    
    // Show first 5 domains
    const top5Domains = sortedDomains.slice(0, 5);
    dataSharedList.innerHTML = top5Domains.map(([domain, data]) => {
      const types = data.types.join(', ');
      return `<div class="mb-1">${domain}: ${types} (${data.count} data point${data.count !== 1 ? 's' : ''})</div>`;
    }).join('');
    
    // If there are more than 5 domains, show expandable section
    if (sortedDomains.length > 3) {
      const remainingDomains = sortedDomains.slice(3);
      if (dataSharedMore) {
        dataSharedMore.style.display = 'block';
        // Update summary text to show count
        const summary = dataSharedMore.querySelector('summary');
        if (summary) {
          summary.textContent = `Show all ${sortedDomains.length} sites`;
        }
      }
      if (dataSharedAll) {
        dataSharedAll.innerHTML = remainingDomains.map(([domain, data]) => {
          const types = data.types.join(', ');
          return `<div class="mb-1">${domain}: ${types} (${data.count} data point${data.count !== 1 ? 's' : ''})</div>`;
        }).join('');
      }
    } else {
      // Hide expandable section if 5 or fewer domains
      if (dataSharedMore) {
        dataSharedMore.style.display = 'none';
      }
    }
  } else {
    dataSharedSection.style.display = 'none';
  }
}

// Check policy claims
async function checkPolicyClaims() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkPolicyClaims' });
    if (response && response.claimCheck) {
      displayPolicyWarning(response.claimCheck);
    }
  } catch (error) {
    console.error('Error checking policy claims:', error);
  }
}

// Display policy warning card
function displayPolicyWarning(claimCheck) {
  const warningCard = document.getElementById('policyWarningCard');
  if (!warningCard) return;
  
  if (claimCheck.isHonest === false && claimCheck.message) {
    warningCard.style.display = 'block';
  } else {
    warningCard.style.display = 'none';
  }
}

// Display error message
function displayError(message) {
  const urlDisplay = document.getElementById('urlDisplay');
  if (urlDisplay) {
    urlDisplay.textContent = message;
    urlDisplay.classList.add('text-red-600');
  }
}

