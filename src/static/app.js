document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildParticipantsSection(activityName, participants) {
    if (participants.length === 0) {
      return `
        <div class="participants-section">
          <h5>Participants</h5>
          <ul class="participants-list">
            <li class="participants-empty">No participants yet</li>
          </ul>
        </div>
      `;
    }

    const participantsItems = participants
      .map((participantEmail) => {
        const safeParticipantEmail = escapeHtml(participantEmail);
        const encodedActivity = encodeURIComponent(activityName);
        const encodedEmail = encodeURIComponent(participantEmail);

        return `
          <li class="participant-item">
            <span class="participant-email">${safeParticipantEmail}</span>
            <button
              type="button"
              class="participant-delete-btn"
              data-activity="${encodedActivity}"
              data-email="${encodedEmail}"
              aria-label="Unregister ${safeParticipantEmail} from ${escapeHtml(activityName)}"
              title="Unregister participant"
            >
              <span class="delete-icon" aria-hidden="true">x</span>
            </button>
          </li>
        `;
      })
      .join("");

    return `
      <div class="participants-section">
        <h5>Participants</h5>
        <ul class="participants-list">
          ${participantsItems}
        </ul>
      </div>
    `;
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        await fetchActivities();
      } else {
        showMessage("error", result.detail || "Failed to unregister participant");
      }
    } catch (error) {
      showMessage("error", "Failed to unregister participant. Please try again.");
      console.error("Error unregistering participant:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = Math.max(0, details.max_participants - participants.length);
        const participantsSection = buildParticipantsSection(name, participants);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p class="activity-description">${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-btn");
    if (!deleteButton) {
      return;
    }

    const activityName = decodeURIComponent(deleteButton.dataset.activity || "");
    const email = decodeURIComponent(deleteButton.dataset.email || "");

    if (!activityName || !email) {
      return;
    }

    deleteButton.disabled = true;
    await unregisterParticipant(activityName, email);
  });

  // Initialize app
  fetchActivities();
});
