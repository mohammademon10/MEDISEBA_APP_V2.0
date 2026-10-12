export const SPECIALTIES = [
  { id: '1', name: 'Cardiology', icon: 'Heart', count: 45 },
  { id: '2', name: 'Neurology', icon: 'Brain', count: 32 },
  { id: '3', name: 'Pediatrics', icon: 'Baby', count: 58 },
  { id: '4', name: 'Orthopedics', icon: 'Bone', count: 27 },
  { id: '5', name: 'Dermatology', icon: 'Sparkles', count: 41 },
  { id: '6', name: 'Oncology', icon: 'Activity', count: 19 },
];

export const FEATURED_DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    rating: 4.9,
    reviews: 124,
    image: 'https://picsum.photos/seed/doctor1/300/300',
    available: true,
    hospital: 'City General Hospital'
  },
  {
    id: 'd2',
    name: 'Dr. Michael Chen',
    specialty: 'Neurologist',
    rating: 4.8,
    reviews: 98,
    image: 'https://picsum.photos/seed/doctor2/300/300',
    available: true,
    hospital: 'Neurological Center'
  },
  {
    id: 'd3',
    name: 'Dr. Emily Williams',
    specialty: 'Pediatrician',
    rating: 4.9,
    reviews: 215,
    image: 'https://picsum.photos/seed/doctor3/300/300',
    available: false,
    hospital: 'Children\'s Care Clinic'
  }
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'John Doe',
    role: 'Patient',
    content: 'MediSeba made it so easy to find a specialist for my father. The digital prescription feature is a life-saver!',
    rating: 5,
    image: 'https://picsum.photos/seed/patient1/100/100'
  },
  {
    id: 't2',
    name: 'Jane Smith',
    role: 'Patient',
    content: 'I love how I can see all my medical history in one place. The token system saved me hours of waiting.',
    rating: 5,
    image: 'https://picsum.photos/seed/patient2/100/100'
  }
];
