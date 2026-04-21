# Alumni Connect Implementation Checklist

This checklist is the working source of truth for the 3-role Alumni Connect System:

- Student
- Alumni
- Faculty

## Common Features

- [x] Role-based login entry points
- [x] Google sign-in with Clerk
- [ ] OTP verification
- [ ] Rich profile editing for all roles
- [ ] Photo upload
- [ ] Resume upload
- [x] Personalized dashboards
- [ ] Notifications
- [x] Search and filter users
- [x] One-to-one messaging
- [ ] Group chat
- [x] Discussion forum
- [ ] Privacy settings
- [x] Logout

## Student Features

### Profile
- [ ] Name, branch, year, skills profile completion
- [ ] Resume upload
- [ ] Career interests

### Career and Growth
- [x] View jobs and internships
- [x] Apply to jobs through opportunity links
- [x] Request referrals
- [x] View company-wise alumni

### Networking
- [x] Search alumni by company
- [ ] Search alumni by role
- [ ] Search alumni by location
- [ ] Connect or follow alumni
- [x] Request mentorship

### Learning
- [ ] Shared resources section
- [x] Attend webinars and workshops through events

### Interaction
- [x] Ask questions in forum
- [x] Participate in discussions

### Events
- [x] View upcoming sessions
- [ ] Register for events

## Alumni Features

### Profile
- [ ] Company, role, experience profile completion
- [ ] Skills
- [ ] LinkedIn
- [ ] Career journey

### Career Contribution
- [x] Post jobs and internships
- [x] Provide referrals
- [ ] Review student resumes

### Mentorship
- [x] Accept mentorship requests
- [ ] Schedule sessions
- [x] Guide students through request responses and chat

### Community
- [x] Answer student queries
- [x] Participate in discussions
- [ ] Share experience posts

### Engagement
- [ ] Post updates
- [ ] Join alumni groups

### Events
- [ ] Host alumni-led events directly
- [x] Attend reunions and browse events

### Contribution
- [ ] Donations and funding
- [ ] Startup mentorship

## Faculty Features

### Profile
- [ ] Department and role
- [ ] Subjects and expertise

### Admin and Moderation
- [x] Verify faculty access
- [ ] Verify alumni accounts fully
- [ ] Approve posts and jobs
- [x] Manage discussions at access level

### Data and Insights
- [x] View student-alumni engagement stats
- [x] Track placements
- [x] Track opportunities and referral activity

### Announcements
- [ ] Post official updates
- [ ] Share notices

### Coordination
- [ ] Connect alumni for placements
- [ ] Connect alumni for guest lectures
- [ ] Connect alumni for internships

### Events
- [x] Create and manage events
- [ ] Invite alumni

### Database Management
- [x] View alumni directory
- [ ] Export data

## Advanced Features

- [ ] AI-based alumni recommendations
- [ ] Smart job matching
- [ ] Leaderboard for active alumni
- [ ] Startup or business directory
- [ ] Polls and surveys
- [ ] Alumni achievements showcase
- [x] Mobile responsive experience
- [ ] PWA support

## Role Permission Summary

| Feature | Student | Alumni | Faculty |
| --- | --- | --- | --- |
| View Profiles | Yes | Yes | Yes |
| Post Jobs | No | Yes | Limited |
| Apply Jobs | Yes | No | No |
| Mentorship | Request | Provide | Manage |
| Approvals | No | No | Yes |
| Events | Join | Host | Manage |
| Analytics | No | No | Yes |

## Current Technical Notes

- The live site is deployed on Vercel.
- Google sign-in is powered by Clerk.
- The app still uses SQLite for Prisma in production, so fallback handling is required for reliability.
- Mentorship request visibility is currently hardened with fallback storage so alumni and students can still see request state when database writes are unstable.
- The attached PDF could not be extracted cleanly in this environment, so this checklist is based on the role requirements provided directly in the workspace conversation.
