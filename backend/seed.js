const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Organization = require('./models/Organization');
const Node = require('./models/Node');
const User = require('./models/User');

dotenv.config();

const branches = [
  { id: 'CSE', name: 'Computer Science & Engineering' },
  { id: 'ECE', name: 'Electronics & Communication' },
  { id: 'EEE', name: 'Electrical & Electronics' },
  { id: 'MECH', name: 'Mechanical Engineering' },
  { id: 'CIVIL', name: 'Civil Engineering' }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Clearing old database...');
    await Organization.deleteMany({});
    await Node.deleteMany({});
    await User.deleteMany({});

    console.log('Creating Organization...');
    const org = await Organization.create({
      name: 'Modern Technical University',
      type: 'college'
    });

    // Root: Director
    const directorNode = await Node.create({
      node_id: 'DIR_OFFICE',
      name: 'Director Office',
      organization: org._id,
      level: 0
    });

    const directorUser = await User.create({
      name: 'Dr. Arthur Root',
      email: 'director@uhgs.com',
      password: 'password123',
      role: 'Director',
      node_id: directorNode._id,
      organization: org._id,
      isAdmin: true,
      status: 'present'
    });

    console.log('Building 5-Branch Hierarchy...');

    for (const branch of branches) {
      // 1. Create HOD Node
      const hodNode = await Node.create({
        node_id: `HOD_${branch.id}`,
        name: `HOD - ${branch.name}`,
        parent_id: directorNode._id,
        organization: org._id,
        level: 1
      });
      directorNode.children.push(hodNode._id);

      // Create HOD User
      await User.create({
        name: `Dr. ${branch.id} Head`,
        email: `hod.${branch.id.toLowerCase()}@uhgs.com`,
        password: 'password123',
        role: 'HOD',
        node_id: hodNode._id,
        organization: org._id,
        status: 'present'
      });

      // 2. Create Faculty Node
      const facNode = await Node.create({
        node_id: `FAC_${branch.id}`,
        name: `${branch.id} Senior Faculty`,
        parent_id: hodNode._id,
        organization: org._id,
        level: 2
      });
      hodNode.children.push(facNode._id);
      await hodNode.save();

      // Create Faculty User
      await User.create({
        name: `Prof. ${branch.id} Teacher`,
        email: `faculty.${branch.id.toLowerCase()}@uhgs.com`,
        password: 'password123',
        role: 'Faculty',
        node_id: facNode._id,
        organization: org._id,
        status: 'present'
      });

      // 3. Create Student Rep Node
      const repNode = await Node.create({
        node_id: `REP_${branch.id}`,
        name: `${branch.id} Class Rep`,
        parent_id: facNode._id,
        organization: org._id,
        level: 3
      });
      facNode.children.push(repNode._id);
      await facNode.save();

      // Create Student Rep User
      await User.create({
        name: `${branch.id} Student Rep`,
        email: `rep.${branch.id.toLowerCase()}@uhgs.com`,
        password: 'password123',
        role: 'Student Rep',
        node_id: repNode._id,
        organization: org._id,
        status: 'present'
      });

      // Create generic Student (on leave for demo)
      await User.create({
        name: `Student of ${branch.id}`,
        email: `student.${branch.id.toLowerCase()}@uhgs.com`,
        password: 'password123',
        role: 'Student',
        node_id: repNode._id,
        organization: org._id,
        status: 'on-leave'
      });
    }

    await directorNode.save();
    console.log('Hierarchy Seeded with 5 Branches Perfectly!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
