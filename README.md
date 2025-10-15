<h1 align="center">MeetCMU</h1>

<p align="center">
 Propose, discover, and join casual events with CMU students
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#database-setup"><strong>Database Setup</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a>
</p>
<br/>

## Features

**Core Functionality:**
- 🟡 **Tentative Events** - Post event ideas to gauge student interest before committing
- 🟢 **Official Events** - Convert popular tentative events to official or post directly as official
- 👥 **Prospect & Attendee Tracking** - See who's interested in tentative events and who's attending official ones
- 🔔 **Smart Notifications** - Prospects get notified when events become official
- 🏷️ **Event Tags** - Filter by categories like sports, study, food, gaming, etc.
- 👤 **User Profiles** - Track hosted events, interested events, and attending events

**Technical Features:**
- Built with [Next.js 15](https://nextjs.org) App Router
- [Supabase](https://supabase.com) for authentication and database
- [Tailwind CSS](https://tailwindcss.com) for styling
- [shadcn/ui](https://ui.shadcn.com/) components
- Row Level Security (RLS) policies for data protection
- Server-side rendering for optimal performance

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account ([create one here](https://database.new))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd meetcmu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

4. **Set up the database**
   
   Run the SQL schema in your Supabase project:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the query
   
   This will create:
   - `profiles` table (user information)
   - `events` table (event data)
   - `event_prospects` table (tentative event interest)
   - `event_attendees` table (official event attendance)
   - `notifications` table (user notifications)
   - Row Level Security policies
   - Automatic triggers for profile creation

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The database schema includes:

- **Row Level Security (RLS)** enabled on all tables
- **Automatic profile creation** when users sign up
- **Cascading deletes** to maintain data integrity
- **Indexes** for optimized query performance

Key policies:
- Users can view all public events
- Users can only create/edit/delete their own events
- Users can add/remove themselves as prospects or attendees
- Users can only view their own notifications

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React

## Project Structure

```
meetcmu/
├── app/
│   ├── (main)/              # Main app routes (requires auth)
│   │   ├── events/
│   │   │   ├── [id]/       # Event detail page
│   │   │   └── new/        # Create event page
│   │   ├── profile/        # User profile page
│   │   └── page.tsx        # Home/Feed page
│   ├── auth/               # Authentication pages
│   └── page.tsx            # Landing page
├── components/
│   ├── events/             # Event-related components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase client utilities
│   └── types/              # TypeScript type definitions
└── supabase/
    └── schema.sql          # Database schema
```

## Features to Implement (Future)

- [ ] Real-time updates using Supabase Realtime
- [ ] Push notifications for mobile
- [ ] Event comments/discussion
- [ ] Image uploads for events
- [ ] Calendar integration
- [ ] Search functionality
- [ ] Event categories and advanced filtering
- [ ] Direct messaging between users

## License

MIT
