export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  difficulty: Difficulty;
  wordCount: number;
  content: string;
  source?: string;
}

export type ArticleCategory = 'science' | 'technology' | 'philosophy' | 'literature' | 'business' | 'self-improvement';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  science: 'Science',
  technology: 'Technology',
  philosophy: 'Philosophy',
  literature: 'Literature',
  business: 'Business',
  'self-improvement': 'Self Improvement',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DIFFICULTY_WPM: Record<Difficulty, number> = {
  beginner: 200,
  intermediate: 300,
  advanced: 450,
};

export const articles: Article[] = [
  // Beginner - Simple sentences, common words
  {
    id: 'beginner-1',
    title: 'The Power of Reading',
    category: 'self-improvement',
    difficulty: 'beginner',
    wordCount: 89,
    content: `Reading is one of the best ways to learn new things. When you read, your brain works hard to understand the words. This makes your brain stronger over time.

Books can take you to new places. You can learn about history, science, or far away lands. Reading also helps you write better and speak better.

Try to read a little bit every day. Start with easy books. Then move to harder ones. Soon you will love reading as much as I do.`,
  },
  {
    id: 'beginner-2',
    title: 'Morning Habits',
    category: 'self-improvement',
    difficulty: 'beginner',
    wordCount: 95,
    content: `How you start your morning can change your whole day. Good morning habits help you feel happy and ready to work.

First, wake up at the same time each day. This helps your body know when to sleep and when to wake. Next, drink a glass of water. Your body needs water after sleeping all night.

Then, take a few minutes to think about your day. What do you want to do? What is most important? This simple habit can make you more successful.`,
  },
  {
    id: 'beginner-3',
    title: 'Why We Sleep',
    category: 'science',
    difficulty: 'beginner',
    wordCount: 88,
    content: `Sleep is very important for your health. When you sleep, your body fixes itself. Your brain also cleans out bad things that build up during the day.

Most adults need seven to nine hours of sleep each night. Children need even more. Without enough sleep, you may feel tired and grumpy.

Good sleep helps you think clearly. It helps you remember things better. It even helps you stay at a healthy weight. So make sure you get enough sleep tonight.`,
  },

  // Intermediate - More complex sentences, varied vocabulary
  {
    id: 'intermediate-1',
    title: 'The Science of Habits',
    category: 'science',
    difficulty: 'intermediate',
    wordCount: 156,
    content: `Every habit follows a simple pattern called the habit loop. First, there is a cue that triggers your brain to start a behavior. Then comes the routine, which is the behavior itself. Finally, there is a reward that helps your brain remember this pattern for the future.

Understanding this loop is the key to changing your habits. If you want to build a new habit, you need to identify a clear cue and provide a satisfying reward. For example, if you want to exercise more, you might put your running shoes by your bed as a cue, and reward yourself with a smoothie afterward.

Breaking bad habits works similarly. You cannot simply eliminate a habit; you must replace it with a new routine while keeping the same cue and reward. This is why understanding the psychology behind habits is so powerful for personal transformation.`,
  },
  {
    id: 'intermediate-2',
    title: 'How Technology Changes Us',
    category: 'technology',
    difficulty: 'intermediate',
    wordCount: 148,
    content: `Technology has transformed nearly every aspect of modern life. We communicate instantly across vast distances, access unlimited information, and automate tasks that once required hours of manual labor.

However, this transformation comes with hidden costs. Our attention spans have shortened as we constantly switch between apps and notifications. Deep thinking has become more difficult when answers are always a search away. Social connections have multiplied but often lack the depth of face-to-face relationships.

The solution is not to reject technology but to use it intentionally. We can set boundaries around our device usage, protect time for focused work, and prioritize meaningful interactions. Technology should serve our goals rather than dictate our behavior.

The most successful people in the digital age are those who master their tools rather than being mastered by them.`,
  },
  {
    id: 'intermediate-3',
    title: 'The Art of Decision Making',
    category: 'business',
    difficulty: 'intermediate',
    wordCount: 162,
    content: `Every day, we make thousands of decisions, from trivial choices about what to eat to significant ones about our careers and relationships. Understanding how to make better decisions is one of the most valuable skills you can develop.

The first principle is to distinguish between reversible and irreversible decisions. Reversible decisions should be made quickly; you can always adjust course later. Irreversible decisions deserve more careful analysis and deliberation.

Second, beware of decision fatigue. Our willpower depletes throughout the day, leading to poorer choices when we are tired. Schedule important decisions for when your energy is highest, typically in the morning.

Third, consider the opportunity cost. Every choice means giving up alternatives. Ask yourself not just whether an option is good, but whether it is the best use of your limited time and resources.

Finally, learn from your decisions. Keep a decision journal to track your reasoning and outcomes over time.`,
  },

  // Advanced - Complex ideas, sophisticated vocabulary
  {
    id: 'advanced-1',
    title: 'The Paradox of Choice',
    category: 'philosophy',
    difficulty: 'advanced',
    wordCount: 189,
    content: `Modern society celebrates freedom of choice as an unqualified good. We assume that more options invariably lead to better outcomes and greater satisfaction. Yet psychological research reveals a more nuanced reality: excessive choice often leads to paralysis, anxiety, and diminished well-being.

When faced with too many alternatives, we experience what psychologists call choice overload. The cognitive burden of evaluating numerous options exhausts our mental resources. We become more likely to defer decisions entirely or make suboptimal choices simply to escape the discomfort of deliberation.

Moreover, abundant choice elevates our expectations while simultaneously increasing our tendency toward regret. With many alternatives available, we imagine that the perfect option must exist somewhere, making any actual choice feel inadequate by comparison.

The antidote to this paradox is not to eliminate choice but to constrain it deliberately. Successful individuals often establish personal rules and routines that reduce trivial decisions, preserving their cognitive capacity for choices that truly matter.

Embracing constraints, rather than resisting them, may paradoxically enhance both our freedom and our satisfaction with the lives we construct.`,
  },
  {
    id: 'advanced-2',
    title: 'Thinking in Systems',
    category: 'science',
    difficulty: 'advanced',
    wordCount: 201,
    content: `Most problems we encounter are not isolated events but manifestations of underlying systemic structures. A systems thinking approach recognizes that elements within a system are interconnected through feedback loops, and that interventions in one area often produce unexpected consequences elsewhere.

Consider the challenge of urban traffic congestion. The intuitive solution of building more roads often backfires because it induces additional demand, a phenomenon known as induced demand. The system adapts to the intervention in ways that undermine its intended effect.

Effective systems thinkers look for leverage points where small changes can produce significant results. These often exist in the goals, rules, and information flows that govern system behavior rather than in the physical components themselves.

Perhaps most importantly, systems thinking cultivates humility. Complex systems are inherently unpredictable; they exhibit emergent properties that cannot be deduced from analyzing individual components. This recognition should make us cautious about confident predictions and sweeping interventions.

The discipline of systems thinking does not provide easy answers. Instead, it offers a framework for asking better questions and understanding why well-intentioned efforts so frequently fail to achieve their objectives.`,
  },
  {
    id: 'advanced-3',
    title: 'The Nature of Creativity',
    category: 'philosophy',
    difficulty: 'advanced',
    wordCount: 178,
    content: `Creativity is often misconceived as a mysterious gift bestowed upon a fortunate few. In reality, creative achievement emerges from the intersection of domain expertise, persistent effort, and environmental conditions that permit experimentation and tolerate failure.

The romantic notion of the solitary genius experiencing sudden inspiration obscures the mundane reality of creative work. Breakthrough ideas typically arise from the recombination of existing concepts in novel configurations. This recombination requires deep familiarity with a field and exposure to diverse influences from adjacent domains.

Furthermore, creativity demands a particular relationship with uncertainty. Creative individuals must tolerate the discomfort of not knowing, of pursuing paths that may lead nowhere. They must resist the premature closure that anxiety about ambiguity encourages.

Organizations seeking to foster creativity must therefore cultivate psychological safety, allowing members to propose unconventional ideas without fear of ridicule or punishment. They must also provide slack, the uncommitted time and resources that enable exploration beyond immediate practical demands.

Creativity, ultimately, is less about innate talent than about creating conditions where novel connections can emerge and develop.`,
  },
  {
    id: 'advanced-4',
    title: 'The Illusion of Understanding',
    category: 'philosophy',
    difficulty: 'advanced',
    wordCount: 185,
    content: `We routinely overestimate our understanding of how things work, a cognitive bias psychologists term the illusion of explanatory depth. When asked to explain familiar phenomena, from how a zipper functions to how economic policies affect inflation, we discover that our confident sense of comprehension dissolves upon closer examination.

This illusion persists because we confuse familiarity with understanding. We interact with countless systems daily without needing to comprehend their underlying mechanisms. Our brains efficiently substitute recognition for genuine knowledge, conserving cognitive resources for more pressing demands.

The consequences extend beyond individual cognition to collective discourse. Political debates often feature participants who hold strong opinions about complex policies they cannot actually explain. This pseudo-understanding fuels polarization, as people defend positions they have never truly examined.

Intellectual humility offers a corrective. By regularly testing our understanding through explanation, we can identify the boundaries of our actual knowledge. The Socratic recognition that wisdom begins with acknowledging our ignorance remains as relevant today as in ancient Athens.

True expertise is characterized not by certainty but by a refined appreciation of what remains unknown.`,
  },
];

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return articles.filter(a => a.category === category);
}

export function getArticlesByDifficulty(difficulty: Difficulty): Article[] {
  return articles.filter(a => a.difficulty === difficulty);
}

export function getArticleById(id: string): Article | undefined {
  return articles.find(a => a.id === id);
}
