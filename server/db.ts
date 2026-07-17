import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  source: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  customer: string; // Customer name or company
  amount: number;
  product: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  completed: boolean;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  email: string;
  phone: string;
  address: string;
  website: string;
}

export interface CRMDatabase {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  sales: Sale[];
  tasks: Task[];
  companyProfile: CompanyProfile;
}

// Default initial seed data
const getInitialData = (): CRMDatabase => {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync("password123", salt);

  return {
    users: [
      {
        id: "u-1",
        name: "Sarah Jenkins",
        email: "admin@enterprise.com",
        passwordHash: adminPasswordHash,
        role: "Admin",
      },
      {
        id: "u-2",
        name: "Alex Rivera",
        email: "alex@enterprise.com",
        passwordHash: bcrypt.hashSync("password123", salt),
        role: "Sales Representative",
      }
    ],
    customers: [
      {
        id: "c-1",
        name: "John Doe",
        email: "john@acme.com",
        phone: "+1 (555) 123-4567",
        company: "Acme Corporation",
        status: "Active",
        createdAt: "2026-01-10T10:00:00.000Z",
      },
      {
        id: "c-2",
        name: "Jane Smith",
        email: "jane@globex.com",
        phone: "+1 (555) 987-6543",
        company: "Globex Industries",
        status: "Active",
        createdAt: "2026-02-15T14:30:00.000Z",
      },
      {
        id: "c-3",
        name: "Robert Johnson",
        email: "rjohnson@apex.com",
        phone: "+1 (555) 246-8135",
        company: "Apex Solutions",
        status: "Active",
        createdAt: "2026-03-05T09:15:00.000Z",
      },
      {
        id: "c-4",
        name: "Emily Davis",
        email: "emily@techstart.io",
        phone: "+1 (555) 369-1470",
        company: "TechStart Inc.",
        status: "Inactive",
        createdAt: "2026-04-12T16:45:00.000Z",
      },
      {
        id: "c-5",
        name: "Michael Brown",
        email: "mbrown@starlight.org",
        phone: "+1 (555) 753-9514",
        company: "Starlight Media",
        status: "Active",
        createdAt: "2026-05-20T11:00:00.000Z",
      },
      {
        id: "c-6",
        name: "Sophia Martinez",
        email: "sophia@innovate.com",
        phone: "+1 (555) 852-9630",
        company: "Innovate Design",
        status: "Active",
        createdAt: "2026-06-02T13:20:00.000Z",
      }
    ],
    leads: [
      {
        id: "l-1",
        name: "William Wilson",
        company: "Omni Consumer Products",
        value: 12500,
        status: "Proposal",
        source: "Website",
        createdAt: "2026-06-15T09:00:00.000Z",
      },
      {
        id: "l-2",
        name: "Olivia Taylor",
        company: "Cyberdyne Systems",
        value: 28000,
        status: "Negotiation",
        source: "Referral",
        createdAt: "2026-06-18T15:30:00.000Z",
      },
      {
        id: "l-3",
        name: "David Anderson",
        company: "Weyland-Yutani",
        value: 45000,
        status: "Qualified",
        source: "Cold Outreach",
        createdAt: "2026-07-01T11:15:00.000Z",
      },
      {
        id: "l-4",
        name: "James Thomas",
        company: "Tyrell Corporation",
        value: 9500,
        status: "Contacted",
        source: "Inbound Call",
        createdAt: "2026-07-05T14:00:00.000Z",
      },
      {
        id: "l-5",
        name: "Emma Jackson",
        company: "Initech LLC",
        value: 5000,
        status: "New",
        source: "LinkedIn",
        createdAt: "2026-07-10T10:30:00.000Z",
      },
      {
        id: "l-6",
        name: "Daniel White",
        company: "Soylent Green Co.",
        value: 15000,
        status: "Won",
        source: "Partner",
        createdAt: "2026-07-12T16:00:00.000Z",
      },
      {
        id: "l-7",
        name: "Charlotte Harris",
        company: "Hooli Corp",
        value: 32000,
        status: "Lost",
        source: "Website",
        createdAt: "2026-07-02T09:00:00.000Z",
      }
    ],
    sales: [
      {
        id: "s-1",
        customer: "Acme Corporation",
        amount: 5200,
        product: "Enterprise CRM License",
        date: "2026-01-20T00:00:00.000Z",
      },
      {
        id: "s-2",
        customer: "Globex Industries",
        amount: 8400,
        product: "SaaS Premium Subscription",
        date: "2026-02-28T00:00:00.000Z",
      },
      {
        id: "s-3",
        customer: "Apex Solutions",
        amount: 12500,
        product: "Cloud Migration Service",
        date: "2026-03-15T00:00:00.000Z",
      },
      {
        id: "s-4",
        customer: "Acme Corporation",
        amount: 2300,
        product: "Additional Seat Licenses",
        date: "2026-04-05T00:00:00.000Z",
      },
      {
        id: "s-5",
        customer: "Starlight Media",
        amount: 6700,
        product: "Custom Integration Package",
        date: "2026-05-25T00:00:00.000Z",
      },
      {
        id: "s-6",
        customer: "Innovate Design",
        amount: 9800,
        product: "Enterprise Suite Annual",
        date: "2026-06-10T00:00:00.000Z",
      },
      {
        id: "s-7",
        customer: "Soylent Green Co.",
        amount: 15000,
        product: "Consulting & Setup",
        date: "2026-07-13T00:00:00.000Z",
      }
    ],
    tasks: [
      {
        id: "t-1",
        title: "Follow up with Weyland-Yutani",
        description: "Call David Anderson to review the custom proposal submitted yesterday.",
        priority: "High",
        dueDate: "2026-07-18",
        completed: false,
      },
      {
        id: "t-2",
        title: "Prepare Tyrell Corp demo",
        description: "Create standard sandbox environment and customize for Tyrell's robotic workflows.",
        priority: "High",
        dueDate: "2026-07-19",
        completed: false,
      },
      {
        id: "t-3",
        title: "Review Globex account expansion",
        description: "Check user adoption stats and schedule business review with Jane Smith.",
        priority: "Medium",
        dueDate: "2026-07-22",
        completed: false,
      },
      {
        id: "t-4",
        title: "Update sales pipeline records",
        description: "Clean up outdated lead stages and update deal sizes for Q3 forecasts.",
        priority: "Low",
        dueDate: "2026-07-25",
        completed: true,
      },
      {
        id: "t-5",
        title: "Email Emma Jackson from Initech",
        description: "Send corporate onboarding documentation and answer pricing tier questions.",
        priority: "Medium",
        dueDate: "2026-07-20",
        completed: true,
      },
      {
        id: "t-6",
        title: "Renew Apex Solutions contract",
        description: "Draft contract addendum for next year's renewal with Apex.",
        priority: "High",
        dueDate: "2026-07-17",
        completed: false,
      }
    ],
    companyProfile: {
      name: "Nexus Enterprise Solutions",
      industry: "Information Technology & Software Services",
      email: "operations@nexusenterprise.com",
      phone: "+1 (800) 555-0199",
      address: "500 Innovation Way, Suite 1200, San Francisco, CA 94105",
      website: "https://nexusenterprise.com",
    },
  };
};

export class JSONDatabase {
  private data: CRMDatabase;

  constructor() {
    this.data = this.load();
  }

  private load(): CRMDatabase {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Error loading DB file, fallback to initial data:", e);
    }

    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: CRMDatabase): void {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing to DB file:", e);
    }
  }

  public get(): CRMDatabase {
    return this.data;
  }

  public save(): void {
    this.saveData(this.data);
  }
}

export const dbInstance = new JSONDatabase();
