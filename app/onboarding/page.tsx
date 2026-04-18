import { redirect } from "next/navigation";

import { getCurrentProfile, getSafeAuth } from "@/lib/auth";
import { isClerkConfigured, missingAuthMessage } from "@/lib/auth-config";
import { alumniSeed, studentSeed } from "@/lib/seed-data";

export default async function OnboardingPage() {
  const { userId } = await getSafeAuth();

  if (!isClerkConfigured) {
    return (
      <section className="page-section">
        <div className="shell">
          <div className="empty-state">
            <strong>Authentication is not live yet.</strong>
            <p className="muted">{missingAuthMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await getCurrentProfile();
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <section className="page-section">
      <div className="shell two-column">
        <div className="dashboard-panel">
          <p className="eyebrow">Claim your imported profile</p>
          <h1 className="page-title" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Complete onboarding in one step.
          </h1>
          <p className="page-lead">
            Sign in with Google, choose whether you are an alumni mentor or a student, then match
            yourself to the record imported from your placement workbook. Alumni who turn on
            mentorship will start receiving request emails.
          </p>
        </div>

        <div className="form-panel">
          <h3>Profile setup</h3>
          <form action="/api/onboarding" method="post" className="form-grid">
            <label>
              I am joining as
              <select name="role" defaultValue="STUDENT">
                <option value="STUDENT">Student</option>
                <option value="ALUMNI">Alumni mentor</option>
              </select>
            </label>

            <label>
              Roll number from imported data
              <input
                name="rollNumber"
                required
                list="roll-numbers"
                placeholder="Example: 22WH1A6606"
              />
            </label>

            <datalist id="roll-numbers">
              {[...studentSeed, ...alumniSeed].map((profileOption) => (
                <option key={profileOption.rollNumber} value={profileOption.rollNumber}>
                  {profileOption.name}
                </option>
              ))}
            </datalist>

            <label>
              Short bio
              <textarea
                name="bio"
                placeholder="Add a short intro, strengths, and what kind of help you want to give or receive."
              />
            </label>

            <label>
              Mentor areas (for alumni)
              <input
                name="mentorAreas"
                placeholder="Resume review, referrals, aptitude rounds, mock interviews"
              />
            </label>

            <label>
              <span>Enable mentorship availability now</span>
              <select name="mentorActive" defaultValue="yes">
                <option value="yes">Yes, publish my mentor profile</option>
                <option value="no">No, keep it private for now</option>
              </select>
            </label>

            <button className="button button-primary" type="submit">
              Save and open dashboard
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
