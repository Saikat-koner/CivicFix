import {
  CivicIssue,
  Contributor,
  HigherUpOfficial,
  MunicipalAppointment,
  GrievancePetition,
  CreateIssueDTO,
  IssueStatus,
  IssueCategory,
} from '../types';

class CivicDataStore {
  private issues: CivicIssue[] = [];
  private contributors: Contributor[] = [];
  private higherUps: HigherUpOfficial[] = [];
  private appointments: MunicipalAppointment[] = [];
  private petitions: GrievancePetition[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    this.issues = [
      {
        id: 'issue-1',
        code: '#CFX-8921',
        title: 'Severe Deep Pothole & Craters on 100 Feet Road',
        description: 'Deep cratered pothole (~15cm depth) on 100 Feet Road, Indiranagar near 12th Main junction. Causing severe traffic bottlenecks and two-wheeler skid hazards.',
        category: 'Roads',
        district: 'Indiranagar (BBMP East Ward 112)',
        address: '100 Feet Road near 12th Main Junction, Indiranagar, Bengaluru, Karnataka 560038',
        location: { lat: 12.9719, lng: 77.6412 },
        status: 'fixed',
        reportedDaysAgo: 'Reported 2 days ago',
        reportedDate: 'Oct 12, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
        repairedImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f7?auto=format&fit=crop&w=800&q=80',
        severity: 'High',
        upvotes: 42,
        hasUpvoted: false,
        mergedReportsCount: 3,
        reportedBy: {
          name: 'Aarav Patel',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDga6L9uLItl8-8p1tqVP4lQCSXFTt7nJYg30cTbkeQlCxiyZs4Q8k8zw6jtRozHgJ_Usj6pr4zVWDKkDYhmwDMcuYYLstNwyFNRxUwNSF9hF8aSMF75XiF3lwpnXvuCjcoLMlJW6QVIacIVq3YVY8DCpqT3cm9CwdMWxU2JUJImELPRd_PzM9rqlPwzqZXOTHB2q_AnUQpKBjwLaoUs2q6zXPVG9p5xiBG5zCv7ej8q4gMoAHxZqiL',
        },
        timeElapsed: '5 days',
        timeline: [
          {
            id: 't-1',
            title: 'Report Submitted',
            timestamp: 'Oct 12, 09:45 AM',
            actor: 'Citizen Mobile Upload (GPS Verified)',
            completed: true,
          },
          {
            id: 't-2',
            title: 'Assigned to BBMP Road Crew',
            timestamp: 'Oct 13, 02:15 PM',
            actor: 'BBMP East Zone Road Maintenance Div #4',
            completed: true,
          },
          {
            id: 't-3',
            title: 'Issue Fixed & Resurfaced',
            timestamp: 'Oct 17, 11:30 AM',
            actor: 'Hot-Mix Bitumen Resurfaced & Rolled',
            completed: true,
            isCurrent: true,
          },
        ],
        comments: [
          {
            id: 'c-1',
            author: 'Er. Suresh Murthy (Asphalt Division)',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdWxQXHnhrBgrRzkT-_yWU1msIUNm3DiSZQscQwSc972UTfZmS-hdkfQpvGPE3PcjiyfFzk5UFJtDJeEt5hTI6Y_q-T0UnpPep_6at_TopmlccOyAzr3FLH72PBxPXnG3ntvwcJUre7thoyMsVcQHHdHVVOFbtKh3bv1pjoQzrRrCh6_yfS60z159Sj9YiK5LDCKOqFpplWwu5Xe0_6ES9M1HYJC4jmn7lcSeNGXF8qYVsX_KiHdg3',
            timestamp: 'Oct 17, 11:35 AM',
            text: 'BBMP Rapid Asphalt Crew sealed the crater with Grade-1 bitumen mix and leveled it flush with road grade. Traffic movement fully restored.',
            isOfficial: true,
            department: 'BBMP Road Infrastructure Cell',
            upvotes: 18,
            hasUpvoted: false,
          },
          {
            id: 'c-2',
            author: 'Priya Sharma',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9rjhaCFCnh9WKA7nQTOgctuimEHugZ-H8RHnOjGsR6Flb6yv5nJxA57QYR8baKrEmGm38A3hGwh9GkzHenVlSpnT02qKvOnp__yM9dciElvXUD3kBjoVylFQB_4MpSe-8xAqbF00TgnT0mj6Pvn1vliK71v92V_u5-Ur3AOHnxVCYqUXERMTMY9viMNVy9ltXmymqfWMTwu6biTxbLTXSVkW4-lO1zkgVmRRNCnTg_k0K6cu7KGrW',
            timestamp: 'Oct 17, 12:40 PM',
            text: 'Drove through Indiranagar 100ft road today—smooth as silk now! Appreciate the fast turnaround by the ward team.',
            upvotes: 9,
            hasUpvoted: false,
          },
        ],
        verificationVotes: { stillThere: 2, isFixed: 22 },
      },
      {
        id: 'issue-2',
        code: '#CFX-9014',
        title: 'Non-Functional Streetlight Grid on 80 Feet Road',
        description: 'Four consecutive municipal LED street poles out of order for 5 days. Complete dark zone between Sony World Signal and Koramangala 4th Block.',
        category: 'Utilities',
        district: 'Koramangala (BBMP South Ward 151)',
        address: '80 Feet Road near Sony World Signal, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        location: { lat: 12.9352, lng: 77.6245 },
        status: 'investigating',
        reportedDaysAgo: 'Reported 1 day ago',
        reportedDate: 'Oct 14, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80',
        severity: 'Medium',
        upvotes: 28,
        hasUpvoted: false,
        mergedReportsCount: 2,
        reportedBy: {
          name: 'Vikram Mehta',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zXj58wzW6H5o7jN-_j6fVf8k4P3sL5f_8W9aQ7e_1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        },
        timeElapsed: '1 day',
        timeline: [
          {
            id: 't-21',
            title: 'Report Submitted',
            timestamp: 'Oct 14, 08:30 PM',
            actor: 'Citizen App GPS Geo-tag',
            completed: true,
          },
          {
            id: 't-22',
            title: 'BESCOM Lineman Inspection Scheduled',
            timestamp: 'Oct 15, 09:15 AM',
            actor: 'BESCOM Koramangala Sub-division #2',
            completed: true,
            isCurrent: true,
          },
          {
            id: 't-23',
            title: 'Underground Cable Replacement',
            timestamp: 'Pending',
            actor: 'BESCOM Electrical Maintenance',
            completed: false,
          },
        ],
        comments: [],
        verificationVotes: { stillThere: 14, isFixed: 1 },
      },
      {
        id: 'issue-3',
        code: '#CFX-8742',
        title: 'Overflowing Garbage Blackspot on 27th Main',
        description: 'Unsegregated commercial garbage dumped along pedestrian walkway near Sector 1 park entrance. Attracting stray animals and obstructing pedestrian pathway.',
        category: 'Sanitation',
        district: 'HSR Layout (BBMP South Ward 174)',
        address: '27th Main Road, Sector 1, HSR Layout, Bengaluru, Karnataka 560102',
        location: { lat: 12.9116, lng: 77.6388 },
        status: 'open',
        reportedDaysAgo: 'Reported 4 hours ago',
        reportedDate: 'Oct 15, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
        severity: 'High',
        upvotes: 19,
        hasUpvoted: false,
        mergedReportsCount: 1,
        reportedBy: {
          name: 'Meera Nambiar',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7d_nQv-s5Xv7Y1jL2mP4o8K1t9uX2c6b4n8m0q3w7e9r1t3y5u7i9o1p3a5s7d9f1g3h5j7k9l1z3x5c7v9b1n3m5q7w9e1r3t5y7u9i',
        },
        timeElapsed: '4 hours',
        timeline: [
          {
            id: 't-31',
            title: 'Report Submitted',
            timestamp: 'Oct 15, 02:15 PM',
            actor: 'AI Auto-Triaged Category: Sanitation',
            completed: true,
            isCurrent: true,
          },
        ],
        comments: [],
        verificationVotes: { stillThere: 7, isFixed: 0 },
      },
      {
        id: 'issue-4',
        code: '#CFX-8619',
        title: 'Broken Tree Branch Blocking MG Road Bus Lane',
        description: 'Heavy eucalyptus branch snapped following pre-monsoon storm winds, leaning dangerously over MG Road bus bay.',
        category: 'Parks',
        district: 'MG Road / CBD (BBMP East Ward 111)',
        address: 'MG Road Metro Station Pillar #142, Bengaluru, Karnataka 560001',
        location: { lat: 12.9756, lng: 77.6067 },
        status: 'investigating',
        reportedDaysAgo: 'Reported 1 day ago',
        reportedDate: 'Oct 14, 2026',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
        severity: 'High',
        upvotes: 35,
        hasUpvoted: false,
        mergedReportsCount: 4,
        reportedBy: {
          name: 'Rohan Deshmukh',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zXj58wzW6H5o7jN-_j6fVf8k4P3sL5f_8W9aQ7e_1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        },
        timeElapsed: '1 day',
        timeline: [
          {
            id: 't-41',
            title: 'Report Submitted',
            timestamp: 'Oct 14, 06:10 PM',
            actor: 'Citizen Verified GPS',
            completed: true,
          },
          {
            id: 't-42',
            title: 'BBMP Forest Wing Crane Dispatched',
            timestamp: 'Oct 15, 08:30 AM',
            actor: 'BBMP Horticulture & Emergency Tree Clearing Cell',
            completed: true,
            isCurrent: true,
          },
        ],
        comments: [],
        verificationVotes: { stillThere: 11, isFixed: 2 },
      },
    ];

    this.contributors = [
      {
        id: 'user-1',
        rank: 1,
        name: 'Aarav Patel',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDga6L9uLItl8-8p1tqVP4lQCSXFTt7nJYg30cTbkeQlCxiyZs4Q8k8zw6jtRozHgJ_Usj6pr4zVWDKkDYhmwDMcuYYLstNwyFNRxUwNSF9hF8aSMF75XiF3lwpnXvuCjcoLMlJW6QVIacIVq3YVY8DCpqT3cm9CwdMWxU2JUJImELPRd_PzM9rqlPwzqZXOTHB2q_AnUQpKBjwLaoUs2q6zXPVG9p5xiBG5zCv7ej8q4gMoAHxZqiL',
        civicCredits: 1840,
        issuesReported: 38,
        issuesResolved: 31,
        badge: 'Civic Guardian 🛡️',
        isCurrentUser: true,
      },
      {
        id: 'user-2',
        rank: 2,
        name: 'Priya Sharma',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9rjhaCFCnh9WKA7nQTOgctuimEHugZ-H8RHnOjGsR6Flb6yv5nJxA57QYR8baKrEmGm38A3hGwh9GkzHenVlSpnT02qKvOnp__yM9dciElvXUD3kBjoVylFQB_4MpSe-8xAqbF00TgnT0mj6Pvn1vliK71v92V_u5-Ur3AOHnxVCYqUXERMTMY9viMNVy9ltXmymqfWMTwu6biTxbLTXSVkW4-lO1zkgVmRRNCnTg_k0K6cu7KGrW',
        civicCredits: 1420,
        issuesReported: 29,
        issuesResolved: 24,
        badge: 'Urban Champion ⚡',
      },
      {
        id: 'user-3',
        rank: 3,
        name: 'Vikram Mehta',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3zXj58wzW6H5o7jN-_j6fVf8k4P3sL5f_8W9aQ7e_1b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
        civicCredits: 1190,
        issuesReported: 22,
        issuesResolved: 19,
        badge: 'Ward Hero 🌟',
      },
      {
        id: 'user-4',
        rank: 4,
        name: 'Meera Nambiar',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7d_nQv-s5Xv7Y1jL2mP4o8K1t9uX2c6b4n8m0q3w7e9r1t3y5u7i9o1p3a5s7d9f1g3h5j7k9l1z3x5c7v9b1n3m5q7w9e1r3t5y7u9i',
        civicCredits: 980,
        issuesReported: 18,
        issuesResolved: 14,
        badge: 'Community Scout 🔍',
      },
    ];

    this.higherUps = [
      {
        id: 'official-1',
        name: 'Dr. K. S. Rajendra, IAS',
        role: 'Zonal Commissioner (East Zone)',
        title: 'Executive In-Charge, BBMP East Zone',
        department: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
        jurisdiction: 'East Zone (Indiranagar, Shivajinagar, CV Raman Nagar, Sarvagnanagar)',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        phone: '+91 80 2297 5500',
        email: 'zonalcomm.east@bbmp.gov.in',
        officeLocation: 'BBMP Zonal Office, Mayo Hall, MG Road, Bengaluru 560001',
        availableModes: ['in-person', 'video', 'phone'],
        nextAvailableSlot: 'Tomorrow at 11:30 AM',
        escalationSpecialties: ['Major Road Craters', 'Stormwater Drain Flooding', 'Ward Contract Delays'],
        rating: 4.9,
        bio: 'Senior Administrative Officer responsible for infrastructure, municipal public works, and grievance redressal for East Bengaluru.',
      },
      {
        id: 'official-2',
        name: 'Er. M. Lakshminarayana',
        role: 'Chief Engineer (Major Roads & Infrastructure)',
        title: 'Head of Arterial Road Construction & Maintenance',
        department: 'BBMP Engineering Cell',
        jurisdiction: 'Greater Bengaluru Urban Corridors',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        phone: '+91 80 2222 1188',
        email: 'ce.roads@bbmp.gov.in',
        officeLocation: 'BBMP Head Office, NR Square, Bengaluru 560002',
        availableModes: ['in-person', 'video'],
        nextAvailableSlot: 'Thursday at 03:00 PM',
        escalationSpecialties: ['Flyover Maintenance', 'Bitumen Pothole Escalations', 'Tender SURE Footpaths'],
        rating: 4.7,
        bio: 'Supervises all asphalt mixing plants, quality control testing, and primary road resurfacing tenders across BBMP limits.',
      },
      {
        id: 'official-3',
        name: 'Smt. Kavitha Manjunath',
        role: 'Superintending Engineer (Electrical & Grid Safety)',
        title: 'Zonal Chief, Public Lighting & Power Grids',
        department: 'BESCOM (Bangalore Electricity Supply Company)',
        jurisdiction: 'South & East Zones (Koramangala, HSR, Indiranagar)',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        phone: '+91 80 2287 3333',
        email: 'se.electrical.south@bescom.karnataka.gov.in',
        officeLocation: 'BESCOM Corporate Office, KR Circle, Bengaluru 560001',
        availableModes: ['in-person', 'video', 'phone'],
        nextAvailableSlot: 'Friday at 10:00 AM',
        escalationSpecialties: ['Dead Streetlight Corridors', 'Transformer Sparking Hazards', 'Hanging Cable Removal'],
        rating: 4.8,
        bio: 'Oversees 24/7 municipal streetlight grid uptime, energy-efficient smart LED conversions, and electrical safety audits.',
      },
    ];
  }

  // --- Issues Methods ---
  public getAllIssues(filters?: {
    status?: string;
    category?: string;
    district?: string;
    search?: string;
  }): CivicIssue[] {
    let result = [...this.issues];

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.category && filters.category !== 'All Issues') {
      result = result.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters?.district && filters.district !== 'all') {
      result = result.filter((i) => i.district.toLowerCase().includes(filters.district!.toLowerCase()));
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getIssueById(id: string): CivicIssue | undefined {
    return this.issues.find((i) => i.id === id || i.code.toLowerCase() === id.toLowerCase());
  }

  public createIssue(dto: CreateIssueDTO): CivicIssue {
    const newId = `issue-${Date.now()}`;
    const newCode = `#CFX-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIssue: CivicIssue = {
      id: newId,
      code: newCode,
      title: dto.title,
      description: dto.description || 'Citizen reported municipal civic issue.',
      category: dto.category,
      district: dto.district || 'Bengaluru Municipal Ward',
      address: dto.address,
      location: dto.location,
      status: 'open',
      reportedDaysAgo: 'Just now',
      reportedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      imageUrl:
        dto.imageUrl ||
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      severity: dto.severity || 'Medium',
      upvotes: 1,
      hasUpvoted: true,
      mergedReportsCount: 1,
      reportedBy: {
        name: dto.reporterName || 'Citizen Contributor',
        avatar:
          dto.reporterAvatar ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDga6L9uLItl8-8p1tqVP4lQCSXFTt7nJYg30cTbkeQlCxiyZs4Q8k8zw6jtRozHgJ_Usj6pr4zVWDKkDYhmwDMcuYYLstNwyFNRxUwNSF9hF8aSMF75XiF3lwpnXvuCjcoLMlJW6QVIacIVq3YVY8DCpqT3cm9CwdMWxU2JUJImELPRd_PzM9rqlPwzqZXOTHB2q_AnUQpKBjwLaoUs2q6zXPVG9p5xiBG5zCv7ej8q4gMoAHxZqiL',
      },
      timeElapsed: 'Just now',
      timeline: [
        {
          id: `t-${Date.now()}`,
          title: 'Report Submitted & Verified',
          timestamp: 'Just now',
          actor: 'Citizen Mobile App (GPS Tagged)',
          completed: true,
          isCurrent: true,
        },
      ],
      comments: [],
      verificationVotes: {
        stillThere: 1,
        isFixed: 0,
      },
    };

    this.issues.unshift(newIssue);
    return newIssue;
  }

  public updateIssue(id: string, updates: Partial<CivicIssue>): CivicIssue | null {
    const issue = this.issues.find((i) => i.id === id || i.code.toLowerCase() === id.toLowerCase());
    if (!issue) return null;
    Object.assign(issue, updates);
    return issue;
  }

  public deleteIssue(id: string): boolean {
    const index = this.issues.findIndex((i) => i.id === id || i.code.toLowerCase() === id.toLowerCase());
    if (index === -1) return false;
    this.issues.splice(index, 1);
    return true;
  }

  public updateIssueStatus(
    id: string,
    status: IssueStatus,
    officialRemark?: string,
    repairedImageUrl?: string
  ): CivicIssue | null {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) return null;

    issue.status = status;
    if (repairedImageUrl) {
      issue.repairedImageUrl = repairedImageUrl;
    }

    const stepTitles: Record<IssueStatus, string> = {
      open: 'Grievance Reopened for Further Verification',
      investigating: 'Dispatched to Municipal Field Crew',
      fixed: 'Issue Resolved & Quality Inspected',
    };

    issue.timeline.push({
      id: `t-${Date.now()}`,
      title: stepTitles[status],
      timestamp: 'Just now',
      actor: officialRemark || 'BBMP Ward Control Room Officer',
      completed: true,
      isCurrent: true,
    });

    if (officialRemark) {
      if (!issue.comments) issue.comments = [];
      issue.comments.push({
        id: `c-${Date.now()}`,
        author: 'BBMP Municipal Officer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        timestamp: 'Just now',
        text: officialRemark,
        isOfficial: true,
        department: 'BBMP Civic Services',
        upvotes: 5,
      });
    }

    return issue;
  }

  public recordVote(id: string, voteType: 'stillThere' | 'isFixed'): CivicIssue | null {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) return null;

    if (voteType === 'stillThere') {
      issue.verificationVotes.stillThere += 1;
    } else {
      issue.verificationVotes.isFixed += 1;
    }
    issue.verificationVotes.userVote = voteType;

    return issue;
  }

  public upvoteIssue(id: string): CivicIssue | null {
    const issue = this.issues.find((i) => i.id === id);
    if (!issue) return null;

    if (!issue.hasUpvoted) {
      issue.upvotes += 1;
      issue.hasUpvoted = true;
    } else {
      issue.upvotes = Math.max(0, issue.upvotes - 1);
      issue.hasUpvoted = false;
    }

    return issue;
  }

  public addComment(
    issueId: string,
    author: string,
    avatar: string,
    text: string,
    isOfficial = false,
    department?: string
  ): CivicIssue | null {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) return null;

    if (!issue.comments) issue.comments = [];

    issue.comments.push({
      id: `c-${Date.now()}`,
      author,
      avatar,
      timestamp: 'Just now',
      text,
      isOfficial,
      department,
      upvotes: 0,
      hasUpvoted: false,
    });

    return issue;
  }

  // --- Higher-Ups & Redressal Methods ---
  public getHigherUps(): HigherUpOfficial[] {
    return this.higherUps;
  }

  public getAppointments(): MunicipalAppointment[] {
    return this.appointments;
  }

  public createAppointment(appointment: Omit<MunicipalAppointment, 'id' | 'createdAt' | 'status'>): MunicipalAppointment {
    const newAppointment: MunicipalAppointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      grievanceReferenceCode: `GRV-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    this.appointments.unshift(newAppointment);

    if (appointment.issueId) {
      const issue = this.issues.find((i) => i.id === appointment.issueId);
      if (issue) {
        issue.escalationStatus = 'appointment_booked';
        issue.appointmentDetails = {
          date: appointment.date,
          time: appointment.timeSlot,
          officerName: appointment.officialName,
          department: appointment.department,
          meetingMode: appointment.meetingMode,
        };
      }
    }

    return newAppointment;
  }

  public getPetitions(): GrievancePetition[] {
    return this.petitions;
  }

  public createPetition(petition: Omit<GrievancePetition, 'id' | 'filedAt' | 'status' | 'petitionNumber'>): GrievancePetition {
    const newPetition: GrievancePetition = {
      ...petition,
      id: `pet-${Date.now()}`,
      petitionNumber: `PET-KA-BBMP-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'under_review',
      filedAt: new Date().toISOString(),
    };

    this.petitions.unshift(newPetition);

    const issue = this.issues.find((i) => i.id === petition.issueId);
    if (issue) {
      issue.escalationStatus = 'escalated_to_higher_up';
      issue.activePetitionId = newPetition.id;
    }

    return newPetition;
  }

  // --- Contributors & Analytics ---
  public getContributors(): Contributor[] {
    return this.contributors;
  }

  public getAnalytics() {
    const total = this.issues.length;
    const fixed = this.issues.filter((i) => i.status === 'fixed').length;
    const investigating = this.issues.filter((i) => i.status === 'investigating').length;
    const open = this.issues.filter((i) => i.status === 'open').length;

    const resolutionRate = total > 0 ? Math.round((fixed / total) * 100) : 0;

    const categoryBreakdown = this.issues.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIssues: total,
      resolvedIssues: fixed,
      activeIssues: open + investigating,
      resolutionRate: `${resolutionRate}%`,
      averageResolutionHours: 28.4,
      categoryBreakdown,
      wardPerformance: [
        { ward: 'Indiranagar (Ward 112)', resolved: 94, pending: 6, score: 9.6 },
        { ward: 'Koramangala (Ward 151)', resolved: 88, pending: 12, score: 8.9 },
        { ward: 'HSR Layout (Ward 174)', resolved: 91, pending: 9, score: 9.2 },
        { ward: 'Whitefield (Ward 84)', resolved: 78, pending: 22, score: 7.9 },
      ],
    };
  }
}

export const dataStore = new CivicDataStore();
