import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { ApolloServer } from "@apollo/server";
import { MongoClient, Db, ObjectId } from "mongodb";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

// --- Types ---
interface Employee {
  _id?: ObjectId;
  name: string;
  position: string;
  department: string;
  salary: number;
  views?: number;
}

interface Department {
  _id?: ObjectId;
  name: string;
  floor: number;
}

interface Context {
  db: Db;
}

interface AddEmployeeArgs {
  name: string;
  position: string;
  department: string;
  salary: number;
}

interface GetEmployeeDetailsArgs {
  id: string;
}

interface GetEmployeesByDepartmentArgs {
  department: string;
}

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "company_db";

let cachedDb: Db | null = null;
let mongoClient: MongoClient | null = null;

// --- Advanced Caching ---
const cache = new InMemoryLRUCache({
  maxSize: 1000,
  ttl: 300000, // 5 minutes
});

const CACHE_KEYS = {
  EMPLOYEES: "employees:all",
  EMPLOYEE_DETAILS: (id: string) => `employee:${id}`,
  DEPARTMENTS: "departments:all",
  EMPLOYEES_BY_DEPT: (dept: string) => `employees:dept:${dept}`,
} as const;

async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await cache.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

async function setInCache<T>(
  key: string,
  data: T,
  ttl = 300000
): Promise<void> {
  try {
    await cache.set(key, JSON.stringify(data), { ttl });
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

async function invalidateCache(keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map((key) => cache.delete(key)));
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

async function connectDB(): Promise<Db> {
  if (cachedDb) return cachedDb;

  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await mongoClient.connect();
    cachedDb = mongoClient.db(DB_NAME);
    console.log("✅ Connected to MongoDB");

    await seedData(cachedDb);
    await ensureViewsField(cachedDb); // Add this line
    return cachedDb;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw new Error("Database connection failed");
  }
}

async function ensureViewsField(db: Db): Promise<void> {
  try {
    const result = await db.collection<Employee>("employees").updateMany(
      { views: { $exists: false } }, // Find documents without views field
      { $set: { views: 0 } } // Set views to 0
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Added views field to ${result.modifiedCount} employees`);
    }
  } catch (error) {
    console.error("Error ensuring views field:", error);
  }
}

// --- Seed Initial Data ---
async function seedData(db: Db): Promise<void> {
  const employees = db.collection<Employee>("employees");
  const departments = db.collection<Department>("departments");

  const employeeCount = await employees.countDocuments();
  const departmentCount = await departments.countDocuments();

  if (employeeCount > 0 || departmentCount > 0) return;

  await departments.insertMany([
    { name: "Engineering", floor: 3 },
    { name: "Marketing", floor: 2 },
    { name: "Human Resources", floor: 1 },
  ]);

  await employees.insertMany([
    {
      name: "Alice Johnson",
      position: "Senior Developer",
      department: "Engineering",
      salary: 95000,
      views: 0,
    },
    {
      name: "Bob Smith",
      position: "Backend Developer",
      department: "Engineering",
      salary: 80000,
      views: 0,
    },
    {
      name: "Carol Williams",
      position: "Marketing Manager",
      department: "Marketing",
      salary: 75000,
      views: 0,
    },
    {
      name: "David Brown",
      position: "Content Strategist",
      department: "Marketing",
      salary: 65000,
      views: 0,
    },
    {
      name: "Emma Davis",
      position: "HR Director",
      department: "Human Resources",
      salary: 85000,
      views: 0,
    },
    {
      name: "Frank Miller",
      position: "Frontend Developer",
      department: "Engineering",
      salary: 78000,
      views: 0,
    },
  ]);

  console.log("✅ Seeded database successfully");
}

// --- GraphQL Schema ---
const typeDefs = `#graphql
  type Employee {
    id: ID!
    name: String!
    position: String!
    department: String!
    salary: Float!
    views: Int!
  }

  type Department {
    id: ID!
    name: String!
    floor: Int!
  }

  type Query {
    getAllEmployees: [Employee!]!
    getEmployeeDetails(id: ID!): Employee
    getEmployeesByDepartment(department: String!): [Employee!]!
    getDepartments: [Department!]!
  }

  type Mutation {
    addEmployee(
      name: String!
      position: String!
      department: String!
      salary: Float!
    ): Employee!

    incrementView(id: ID!): Employee!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    getAllEmployees: async (_: unknown, __: unknown, { db }: Context) => {
      try {
        const cacheKey = CACHE_KEYS.EMPLOYEES;
        const cached = await getFromCache(cacheKey);
        if (cached) {
          console.log("Cache hit for getAllEmployees");
          return cached;
        }

        console.log("Cache miss for getAllEmployees, querying DB");
        const employees = await db
          .collection<Employee>("employees")
          .find({})
          .sort({ name: 1 })
          .toArray();

        const result = employees.map((emp) => ({
          id: emp._id!.toString(),
          name: emp.name,
          position: emp.position,
          department: emp.department,
          salary: emp.salary,
          views: emp.views ?? 0,
        }));

        await setInCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error("Error fetching all employees:", error);
        throw new Error("Failed to fetch employees");
      }
    },

    getEmployeeDetails: async (
      _: unknown,
      { id }: GetEmployeeDetailsArgs,
      { db }: Context
    ) => {
      try {
        if (!ObjectId.isValid(id))
          throw new Error("Invalid employee ID format");

        const cacheKey = CACHE_KEYS.EMPLOYEE_DETAILS(id);
        const cached = await getFromCache(cacheKey);
        if (cached) {
          console.log(`Cache hit for employee ${id}`);
          return cached;
        }

        console.log(`Cache miss for employee ${id}`);
        const employee = await db
          .collection<Employee>("employees")
          .findOne({ _id: new ObjectId(id) });

        if (!employee) throw new Error("Employee not found");

        const result = {
          id: employee._id!.toString(),
          name: employee.name,
          position: employee.position,
          department: employee.department,
          salary: employee.salary,
          views: employee.views ?? 0,
        };

        await setInCache(cacheKey, result, 600000);
        return result;
      } catch (error) {
        console.error("Error fetching employee:", error);
        throw new Error(`Error fetching employee: ${(error as Error).message}`);
      }
    },

    getEmployeesByDepartment: async (
      _: unknown,
      { department }: GetEmployeesByDepartmentArgs,
      { db }: Context
    ) => {
      try {
        const employees = await db
          .collection<Employee>("employees")
          .find({ department })
          .toArray();

        return employees.map((emp) => ({
          id: emp._id!.toString(),
          name: emp.name,
          position: emp.position,
          department: emp.department,
          salary: emp.salary,
          views: emp.views ?? 0,
        }));
      } catch (error) {
        console.error("Error fetching by department:", error);
        throw new Error("Failed to fetch employees by department");
      }
    },

    getDepartments: async (_: unknown, __: unknown, { db }: Context) => {
      try {
        const cacheKey = CACHE_KEYS.DEPARTMENTS;
        const cached = await getFromCache(cacheKey);
        if (cached) {
          console.log("Cache hit for getDepartments");
          return cached;
        }

        const departments = await db
          .collection<Department>("departments")
          .find({})
          .sort({ name: 1 })
          .toArray();

        const result = departments.map((dept) => ({
          id: dept._id!.toString(),
          name: dept.name,
          floor: dept.floor,
        }));

        await setInCache(cacheKey, result, 1800000);
        return result;
      } catch (error) {
        console.error("Error fetching departments:", error);
        throw new Error("Failed to fetch departments");
      }
    },
  },

  Mutation: {
    addEmployee: async (_: unknown, args: AddEmployeeArgs, { db }: Context) => {
      try {
        const { name, position, department, salary } = args;

        if (!name || name.trim().length < 2)
          throw new Error("Name must be at least 2 characters");
        if (!position || position.trim().length < 2)
          throw new Error("Position must be at least 2 characters");
        if (!department || department.trim().length === 0)
          throw new Error("Department is required");
        if (salary < 1000 || salary > 1000000)
          throw new Error("Salary must be between $1,000 and $1,000,000");

        const newEmployee: Employee = {
          name: name.trim(),
          position: position.trim(),
          department: department.trim(),
          salary: parseFloat(salary.toString()),
          views: 0,
        };

        const insert = await db
          .collection<Employee>("employees")
          .insertOne(newEmployee);
        const result = { id: insert.insertedId.toString(), ...newEmployee };

        await invalidateCache([
          CACHE_KEYS.EMPLOYEES,
          CACHE_KEYS.EMPLOYEES_BY_DEPT(department),
        ]);

        console.log("Employee added successfully");
        return result;
      } catch (error) {
        console.error("Error adding employee:", error);
        throw new Error(`Error adding employee: ${(error as Error).message}`);
      }
    },

    // Replace your incrementView mutation in the route.ts file with this improved version

    incrementView: async (
      _: unknown,
      { id }: { id: string },
      { db }: Context
    ) => {
      try {
        const cleanId = id.trim();

        if (!ObjectId.isValid(cleanId)) {
          throw new Error("Invalid employee ID format");
        }

        const _id = new ObjectId(cleanId);

        // First verify employee exists
        const employee = await db
          .collection<Employee>("employees")
          .findOne({ _id });

        if (!employee) {
          throw new Error("Employee not found");
        }

        // Simple increment operation
        await db
          .collection<Employee>("employees")
          .updateOne({ _id }, { $inc: { views: 1 } });

        // Get the updated employee
        const result = await db
          .collection<Employee>("employees")
          .findOne({ _id });

        if (!result) {
          throw new Error("Failed to update employee views");
        }

        // Invalidate cache
        await invalidateCache([
          CACHE_KEYS.EMPLOYEE_DETAILS(id),
          CACHE_KEYS.EMPLOYEES,
          CACHE_KEYS.EMPLOYEES_BY_DEPT(result.department),
        ]);

        return {
          id: result._id!.toString(),
          name: result.name,
          position: result.position,
          department: result.department,
          salary: result.salary,
          views: result.views ?? 0,
        };
      } catch (error) {
        console.error("Error incrementing view:", error);
        throw new Error(`Error incrementing view: ${(error as Error).message}`);
      }
    },
  },
};

// --- Apollo Server ---
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache,
  csrfPrevention: false,
  introspection: true,
  formatError: (error) => ({
    message: error.message,
    extensions: {
      code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString(),
    },
  }),
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    const db = await connectDB();
    return { db };
  },
});

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
