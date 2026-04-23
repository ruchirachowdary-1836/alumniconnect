"use client";

import { useEffect, useState } from "react";
import { useEffectEvent } from "react";

import type { OpportunityBoardItem } from "@/lib/opportunities-data";

export function OpportunitiesBoard({
  initialOpportunities,
  canPost,
  canRequestReferral,
}: {
  initialOpportunities: OpportunityBoardItem[];
  canPost: boolean;
  canRequestReferral: boolean;
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("Job");
  const [location, setLocation] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [description, setDescription] = useState("");
  const [errorText, setErrorText] = useState("");
  const [postedNotice, setPostedNotice] = useState(false);

  const loadOpportunities = useEffectEvent(async () => {
    try {
      const response = await fetch("/api/opportunities", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { opportunities: OpportunityBoardItem[] };
      setOpportunities(data.opportunities);
    } catch {
      // Preserve the current list if polling fails briefly.
    }
  });

  useEffect(() => {
    setOpportunities(initialOpportunities);
  }, [initialOpportunities]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadOpportunities();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [loadOpportunities]);

  const handlePublish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) {
      return;
    }

    setErrorText("");
    setPostedNotice(false);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("company", company.trim());
      formData.append("type", type);
      formData.append("location", location.trim());
      formData.append("applyLink", applyLink.trim());
      formData.append("description", description.trim());

      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorText(error?.error || "Unable to publish the opportunity right now.");
        return;
      }

      const data = (await response.json()) as { opportunities: OpportunityBoardItem[] };
      setOpportunities(data.opportunities);
      setTitle("");
      setCompany("");
      setType("Job");
      setLocation("");
      setApplyLink("");
      setDescription("");
      setPostedNotice(true);
    } catch {
      setErrorText("Unable to publish the opportunity right now.");
    }
  };

  return (
    <>
      {postedNotice ? (
        <div className="comment-box" style={{ marginBottom: 18 }}>
          <strong>Opportunity posted.</strong>
          <p className="small muted" style={{ marginTop: 8 }}>
            The opportunity is now visible for students to explore and request referrals.
          </p>
        </div>
      ) : null}

      {canPost ? (
        <form onSubmit={handlePublish} className="dashboard-panel form-grid" style={{ marginBottom: 22 }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div>
              <h3>Post a job or internship</h3>
              <p className="card-copy">Alumni can share hiring openings, internships, and referral opportunities here.</p>
            </div>
          </div>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Example: Backend Engineer Intern" />
          </label>
          <label>
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} required placeholder="Example: Microsoft" />
          </label>
          <label>
            Type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>Job</option>
              <option>Internship</option>
            </select>
          </label>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Example: Hyderabad / Remote" />
          </label>
          <label>
            Apply link
            <input value={applyLink} onChange={(event) => setApplyLink(event.target.value)} placeholder="https://company.com/careers/..." />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              placeholder="Mention skills, eligibility, expected work, and how students should prepare."
            />
          </label>
          <button className="button button-primary" type="submit">
            Publish Opportunity
          </button>
        </form>
      ) : (
        <div className="dashboard-panel" style={{ marginBottom: 22 }}>
          <h3>Career board</h3>
          <p className="card-copy">
            Students can browse opportunities and request referrals. Alumni can post opportunities from their own portal.
          </p>
        </div>
      )}

      {errorText ? (
        <p className="small" style={{ marginBottom: 14, color: "#b42318" }}>
          {errorText}
        </p>
      ) : null}

      <div className="section-header">
        <div>
          <h2>Open Roles</h2>
          <p className="section-subtitle">Browse current alumni-shared job and internship opportunities.</p>
        </div>
        <span className="tab-pill active">{opportunities.length} listed</span>
      </div>

      <div className="request-grid" style={{ marginTop: 18 }}>
        {opportunities.map((opportunity) => (
          <article key={opportunity.id} className="request-card">
            <div className="section-header">
              <div>
                <h3>{opportunity.title}</h3>
                <p className="card-copy">
                  {opportunity.company} • {opportunity.type} • {opportunity.location}
                </p>
              </div>
              <span className="tab-pill active">{opportunity.status}</span>
            </div>

            <p>{opportunity.description}</p>
            <p className="small muted" style={{ marginTop: 10 }}>
              Posted by {opportunity.postedByName}
            </p>

            <div className="split-actions" style={{ marginTop: 14 }}>
              {opportunity.applyLink ? (
                <a href={opportunity.applyLink} target="_blank" rel="noreferrer" className="button button-ghost">
                  Apply Link
                </a>
              ) : null}

              {canRequestReferral ? (
                <form action="/api/referrals" method="post">
                  <input type="hidden" name="opportunityId" value={opportunity.id} />
                  <button className="button button-secondary" type="submit">
                    Request Referral
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
