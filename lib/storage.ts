// Structure d'un cours sauvegardé
export interface SavedCourse {
  id: string;
  title: string;
  summary: string;
  audioScript: string;
  quiz: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
  createdAt: number;
}

// 1. Sauvegarder un cours en local (Hors-Ligne)
export function saveCourseLocally(courseData: Omit<SavedCourse, 'id' | 'createdAt'>): SavedCourse {
  const existingCourses = getLocalCourses();
  
  const newCourse: SavedCourse = {
    ...courseData,
    id: Date.now().toString(),
    createdAt: Date.now()
  };

  existingCourses.unshift(newCourse);
  localStorage.setItem('studyquiz_courses', JSON.stringify(existingCourses));
  return newCourse;
}

// 2. Récupérer tous les cours enregistrés
export function getLocalCourses(): SavedCourse[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('studyquiz_courses');
  return data ? JSON.parse(data) : [];
}

// 3. Supprimer un cours enregistre
export function deleteLocalCourse(id: string) {
  const existingCourses = getLocalCourses();
  const updated = existingCourses.filter(course => course.id !== id);
  localStorage.setItem('studyquiz_courses', JSON.stringify(updated));
}