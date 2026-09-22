import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Target, Clock, ArrowRight, Zap, RotateCcw, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Participant } from '../types';

export interface PhysicistPersona {
  id: string;
  name: string;
  era: string;
  title: string;
  badge: string;
  quote: string;
  description: string;
  image: string;
  fallbackIcon: string;
  themeColor: string;
  borderColor: string;
}

export const PHYSICIST_PERSONAS: PhysicistPersona[] = [
  {
    id: 'tesla',
    name: 'Nikola Tesla',
    era: '1856 – 1943',
    title: 'Master of Electrical Resonance & Mechanical Oscillators',
    badge: '⚡ Harmonic Grandmaster',
    quote: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.',
    description: 'Like Tesla experimenting with pocket oscillators in his Manhattan laboratory, your frequency precision commands supreme harmonic energy!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/N.Tesla.JPG/480px-N.Tesla.JPG',
    fallbackIcon: '⚡',
    themeColor: 'from-amber-500 to-yellow-300',
    borderColor: 'border-amber-400'
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    era: '1879 – 1955',
    title: 'Theoretical Wave Dynamics & Field Visionary',
    badge: '🌌 Theoretical Virtuoso',
    quote: 'Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.',
    description: 'With the visionary intuition of Einstein, you perceived the underlying differential wave fields and solved resonance modes with mathematical elegance.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/480px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg',
    fallbackIcon: '🌌',
    themeColor: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'curie',
    name: 'Marie Curie',
    era: '1867 – 1934',
    title: 'Relentless Pioneer of Energy Fields & Experimental Rigor',
    badge: '🧪 Precision Pioneer',
    quote: 'Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.',
    description: 'With the fearless patience and analytical rigor of Marie Curie, you broke through fatigue limits through disciplined, coherent resonance strikes.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_c._1920s.jpg/480px-Marie_Curie_c._1920s.jpg',
    fallbackIcon: '🧪',
    themeColor: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'euler',
    name: 'Leonhard Euler',
    era: '1707 – 1783',
    title: 'Architect of Beam Deflection & Differential Equations',
    badge: '📐 Structural Analyst',
    quote: 'Mathematicians have tried in vain to discover order; differential equations uncover the deep harmonic rhythm of the physical cosmos.',
    description: 'Leonhard Euler formulated the foundational beam equation. Your deduction of flexural stiffness and modal shapes honors his eternal mathematical legacy!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Leonhard_Euler.jpg/480px-Leonhard_Euler.jpg',
    fallbackIcon: '📐',
    themeColor: 'from-purple-400 to-indigo-500',
    borderColor: 'border-purple-400'
  },
  {
    id: 'newton',
    name: 'Isaac Newton',
    era: '1643 – 1727',
    title: 'Titan of Classical Mechanics & Differential Calculus',
    badge: '🍎 Mechanics Titan',
    quote: 'If I have seen further, it is by standing on the shoulders of giants.',
    description: 'Isaac Newton established the fundamental laws of motion that govern every oscillating mass-spring system in the physical world.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/GodfreyKneller-IsaacNewton-1689.jpg/480px-GodfreyKneller-IsaacNewton-1689.jpg',
    fallbackIcon: '🍎',
    themeColor: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'feynman',
    name: 'Richard Feynman',
    era: '1918 – 1988',
    title: 'Intuitive Dynamic Rhythm & Quantum Maestro',
    badge: '🥁 Dynamic Solver',
    quote: 'The pleasure of finding the thing out, the kick in the discovery, the observation that nature obeys such rhythm—those are the true rewards.',
    description: 'Attacking second-order differential mechanics with Feynman’s playful curiosity, you tuned your pulses by feeling the natural harmonic groove of the physical structure!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/RichardFeynman-PFL198.jpg/480px-RichardFeynman-PFL198.jpg',
    fallbackIcon: '🥁',
    themeColor: 'from-rose-400 to-amber-500',
    borderColor: 'border-rose-400'
  },
  {
    id: 'noether',
    name: 'Emmy Noether',
    era: '1882 – 1935',
    title: 'Mathematical Queen of Symmetry & Energy Invariance',
    badge: '♾️ Symmetry Master',
    quote: 'My methods are really methods of working and thinking; this is why they have crept in everywhere anonymously.',
    description: 'Emmy Noether linked continuous symmetries directly to conservation of energy. You utilized symmetrical harmonic excitation to build peak resonant energy!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Emmy_Noether.jpg/480px-Emmy_Noether.jpg',
    fallbackIcon: '♾️',
    themeColor: 'from-fuchsia-400 to-pink-500',
    borderColor: 'border-fuchsia-400'
  },
  {
    id: 'gauss',
    name: 'Carl Friedrich Gauss',
    era: '1777 – 1855',
    title: 'Prince of Mathematicians & Field Dynamics',
    badge: '👑 Mathematical Prince',
    quote: 'Mathematics is the queen of the sciences and number theory is the queen of mathematics.',
    description: 'Gauss mastered differential geometry and celestial orbits. Your precision in modal harmonics channels his computational prowess!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carl_Friedrich_Gauss.jpg/480px-Carl_Friedrich_Gauss.jpg',
    fallbackIcon: '👑',
    themeColor: 'from-yellow-400 to-amber-600',
    borderColor: 'border-yellow-400'
  },
  {
    id: 'galileo',
    name: 'Galileo Galilei',
    era: '1564 – 1642',
    title: 'Father of Pendulum Oscillations & Modern Physics',
    badge: '🔭 Harmonic Pioneer',
    quote: 'Measure what is measurable, and make measurable what is not so.',
    description: 'Watching swinging cathedral chandeliers inspired Galileo to discover the isochronism of harmonic oscillation. You carry forward classical experimental physics!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg/480px-Justus_Sustermans_-_Portrait_of_Galileo_Galilei%2C_1636.jpg',
    fallbackIcon: '🔭',
    themeColor: 'from-sky-400 to-cyan-500',
    borderColor: 'border-sky-400'
  },
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    era: '1815 – 1852',
    title: 'Pioneer of Algorithmic Computation & Analytical Engines',
    badge: '💻 Algorithmic Visionary',
    quote: 'The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
    description: 'Ada Lovelace foresaw mathematical algorithms calculating complex natural phenomena long before modern computers were built.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/480px-Ada_Lovelace_portrait.jpg',
    fallbackIcon: '💻',
    themeColor: 'from-purple-400 to-pink-500',
    borderColor: 'border-purple-400'
  },
  {
    id: 'fourier',
    name: 'Joseph Fourier',
    era: '1768 – 1830',
    title: 'Father of Harmonic Analysis & Wave Decomposition',
    badge: '〰️ Harmonic Analyst',
    quote: 'The profound study of nature is the most fertile source of mathematical discoveries.',
    description: 'Fourier proved that all complex vibrational waveforms decompose into fundamental sinusoidal eigenmodes. Your strikes excited pure harmonic frequencies!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Fourier2_-_restoration1.jpg/480px-Fourier2_-_restoration1.jpg',
    fallbackIcon: '〰️',
    themeColor: 'from-cyan-400 to-teal-500',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'rayleigh',
    name: 'Lord Rayleigh',
    era: '1842 – 1919',
    title: 'Pioneer of Acoustics & Sound Wave Mechanics',
    badge: '🌊 Wave Explorer',
    quote: 'The resolution of complicated vibrations into simple harmonic components is the key to understanding physical nature.',
    description: 'Author of "The Theory of Sound", Lord Rayleigh demystified acoustic vibration and modal dissipation across physical media.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/John_William_Strutt.jpg/480px-John_William_Strutt.jpg',
    fallbackIcon: '🌊',
    themeColor: 'from-teal-400 to-emerald-500',
    borderColor: 'border-teal-400'
  },
  {
    id: 'johnson',
    name: 'Katherine Johnson',
    era: '1918 – 2020',
    title: 'Mathematical Navigator of Orbital Dynamics',
    badge: '🚀 Trajectory Virtuoso',
    quote: 'Like what you do, and then you will do your best.',
    description: 'Calculating complex aerospace flight equations with pinpoint accuracy, Katherine Johnson proved that mathematical discipline conquers the skies.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Katherine_Johnson_1983.jpg/480px-Katherine_Johnson_1983.jpg',
    fallbackIcon: '🚀',
    themeColor: 'from-indigo-400 to-cyan-400',
    borderColor: 'border-indigo-400'
  },
  {
    id: 'maxwell',
    name: 'James Clerk Maxwell',
    era: '1831 – 1879',
    title: 'Master of Electromagnetic Wave Equations',
    badge: '⚡ Field Unifier',
    quote: 'The equations of electrodynamics are the mathematical poem of nature.',
    description: 'Maxwell unified electricity, magnetism, and optics into second-order wave equations that describe all electromagnetic propagation.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/James_Clerk_Maxwell.png/480px-James_Clerk_Maxwell.png',
    fallbackIcon: '⚡',
    themeColor: 'from-amber-400 to-cyan-400',
    borderColor: 'border-amber-400'
  },
  {
    id: 'germain',
    name: 'Sophie Germain',
    era: '1776 – 1831',
    title: 'Pioneer of Elastic Surface Vibration & Plate Dynamics',
    badge: '🛡️ Elasticity Pioneer',
    quote: 'Algebra is but written geometry and geometry is but figured algebra.',
    description: 'Sophie Germain revolutionized mathematical physics by formulating the differential equations governing the vibration of thin elastic plates!',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sophie_Germain.jpg/480px-Sophie_Germain.jpg',
    fallbackIcon: '🛡️',
    themeColor: 'from-rose-400 to-purple-500',
    borderColor: 'border-rose-400'
  },
  {
    id: 'poincare',
    name: 'Henri Poincaré',
    era: '1854 – 1912',
    title: 'Founder of Chaos Theory & Nonlinear Dynamics',
    badge: '🌀 Dynamical Theorist',
    quote: 'It is through science that we prove, but through intuition that we discover.',
    description: 'Poincaré pioneered the study of three-body resonance and nonlinear phase space orbits, uncovering the complex dynamics of physical systems.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Henri_Poincare_1887.jpg/480px-Henri_Poincare_1887.jpg',
    fallbackIcon: '🌀',
    themeColor: 'from-blue-400 to-indigo-600',
    borderColor: 'border-blue-400'
  },
  {
    id: 'ramanujan',
    name: 'Srinivasa Ramanujan',
    era: '1887 – 1920',
    title: 'Genius of Infinite Series & Harmonic Partitions',
    badge: '✨ Series Miracle',
    quote: 'An equation for me has no meaning unless it expresses a thought of God.',
    description: 'Ramanujan discovered thousands of revolutionary mathematical identities and modular forms that today illuminate quantum resonance and string theory.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Srinivasa_Ramanujan_-_OPC_-_1.jpg/480px-Srinivasa_Ramanujan_-_OPC_-_1.jpg',
    fallbackIcon: '✨',
    themeColor: 'from-amber-400 to-emerald-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'faraday',
    name: 'Michael Faraday',
    era: '1791 – 1867',
    title: 'Trailblazer of Magnetic Induction & Force Fields',
    badge: '🧲 Induction Master',
    quote: 'Nothing is too wonderful to be true if it be consistent with the laws of nature.',
    description: 'Faraday discovered electromagnetic induction and lines of force, demonstrating how dynamic fields transfer continuous physical power.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Michael_Faraday_001.jpg/480px-Michael_Faraday_001.jpg',
    fallbackIcon: '🧲',
    themeColor: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'mirzakhani',
    name: 'Maryam Mirzakhani',
    era: '1977 – 2017',
    title: 'Fields Medalist in Hyperbolic Geometry & Complex Dynamics',
    badge: '🌐 Hyperbolic Geometer',
    quote: 'The beauty of mathematics only shows itself to more patient followers.',
    description: 'Maryam Mirzakhani explored the deep geometric dynamics of curved Riemann surfaces, illustrating how trajectories oscillate across complex geometries.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Maryam_Mirzakhani_2014.jpg/480px-Maryam_Mirzakhani_2014.jpg',
    fallbackIcon: '🌐',
    themeColor: 'from-purple-400 to-teal-400',
    borderColor: 'border-purple-400'
  },
  {
    id: 'turing',
    name: 'Alan Turing',
    era: '1912 – 1954',
    title: 'Father of Computer Science & Mathematical Morphogenesis',
    badge: '🧠 Computation Architect',
    quote: 'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.',
    description: 'Turing decrypted mechanical communication codes and formulated reaction-diffusion differential equations that explain natural wave patterning.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/480px-Alan_Turing_Aged_16.jpg',
    fallbackIcon: '🧠',
    themeColor: 'from-emerald-400 to-cyan-500',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'riemann',
    name: 'Bernhard Riemann',
    era: '1826 – 1866',
    title: 'Pioneer of Differential Manifolds & Wave Propagation',
    badge: '📐 Manifold Visionary',
    quote: 'If only I had the theorems! Then I should find the proofs easily enough.',
    description: 'Riemann invented non-Euclidean differential geometry and analyzed shock waves, laying the mathematical groundwork for Einstein’s general relativity.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Georg_Friedrich_Bernhard_Riemann.jpeg/480px-Georg_Friedrich_Bernhard_Riemann.jpeg',
    fallbackIcon: '📐',
    themeColor: 'from-blue-400 to-cyan-400',
    borderColor: 'border-blue-400'
  },
  {
    id: 'wu',
    name: 'Chien-Shiung Wu',
    era: '1912 – 1997',
    title: 'First Lady of Physics & Experimental Symmetry Breaker',
    badge: '⚛️ Experimental Authority',
    quote: 'There is only one thing worse than coming home from the lab to a sink full of dirty dishes, and that is not going to the lab at all!',
    description: 'Chien-Shiung Wu performed the definitive experimental test of parity violation in weak interactions, disproving long-held symmetry assumptions.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Chien-Shiung_Wu_%281912-1997%29_in_1958.jpg/480px-Chien-Shiung_Wu_%281912-1997%29_in_1958.jpg',
    fallbackIcon: '⚛️',
    themeColor: 'from-teal-400 to-amber-400',
    borderColor: 'border-teal-400'
  },
  {
    id: 'bohr',
    name: 'Niels Bohr',
    era: '1885 – 1962',
    title: 'Architect of Quantum States & Complementary Waves',
    badge: '🪐 Orbital Pioneer',
    quote: 'Everything we call real is made of things that cannot be regarded as real.',
    description: 'Bohr recognized that discrete natural energy levels and modal states define both physical matter and dynamic harmonic equilibria.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Niels_Bohr.jpg/480px-Niels_Bohr.jpg',
    fallbackIcon: '🪐',
    themeColor: 'from-cyan-400 to-indigo-500',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'meitner',
    name: 'Lise Meitner',
    era: '1878 – 1968',
    title: 'Pioneer of Nuclear Energy Conversion & Resonance',
    badge: '💥 Energy Pioneer',
    quote: 'Life need not be easy, provided only that it is not empty.',
    description: 'Lise Meitner provided the first theoretical explanation for nuclear fission, showing how atomic stability breaks down under resonant perturbation.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Lise_Meitner12_%28cropped%29.jpg/480px-Lise_Meitner12_%28cropped%29.jpg',
    fallbackIcon: '💥',
    themeColor: 'from-rose-400 to-amber-500',
    borderColor: 'border-rose-400'
  },
  {
    id: 'dirac',
    name: 'Paul Dirac',
    era: '1902 – 1984',
    title: 'Sculptor of Relativistic Quantum Wave Equations',
    badge: '🎯 Waveform Sculptor',
    quote: 'A physical law must possess mathematical beauty.',
    description: 'Dirac combined quantum mechanics with special relativity, predicting antimatter and pioneering mathematical distribution delta functions.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Paul_Dirac%2C_1933.jpg/480px-Paul_Dirac%2C_1933.jpg',
    fallbackIcon: '🎯',
    themeColor: 'from-purple-500 to-indigo-600',
    borderColor: 'border-purple-400'
  },
  {
    id: 'pascal',
    name: 'Blaise Pascal',
    era: '1623 – 1662',
    title: 'Master of Fluid Pressure & Hydrostatic Oscillations',
    badge: '⚖️ Hydrostatic Master',
    quote: 'Kind words do not cost much. Yet they accomplish much.',
    description: 'Pascal established principles of fluid pressure transmission, showing how hydraulic waves distribute force through mechanical systems.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Blaise_pascal.jpg/480px-Blaise_pascal.jpg',
    fallbackIcon: '⚖️',
    themeColor: 'from-emerald-400 to-cyan-500',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'schrodinger',
    name: 'Erwin Schrödinger',
    era: '1887 – 1961',
    title: 'Creator of the Quantum Wave Mechanics Equation',
    badge: '🐈 Wave Mechanics Father',
    quote: 'The task is not so much to see what no one has yet seen; but to think what nobody has yet thought, about that which everybody sees.',
    description: 'Schrödinger formulated the fundamental partial differential equation governing continuous wave functions and modal states in physical reality.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Erwin_Schr%C3%B6dinger_%281933%29.jpg/480px-Erwin_Schr%C3%B6dinger_%281933%29.jpg',
    fallbackIcon: '🐈',
    themeColor: 'from-indigo-400 to-teal-400',
    borderColor: 'border-indigo-400'
  },
  {
    id: 'kepler',
    name: 'Johannes Kepler',
    era: '1571 – 1630',
    title: 'Discoverer of Planetary Harmonies & Orbital Resonances',
    badge: '☀️ Cosmic Harmonist',
    quote: 'The diversity of the phenomena of nature is so great, and the treasures hidden in the heavens so rich, precisely that the human mind shall never be lacking in fresh nourishment.',
    description: 'In "Harmonices Mundi", Kepler unveiled harmonic laws of planetary orbital periods and mechanical periodicity across celestial space.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Johannes_Kepler_1610.jpg/480px-Johannes_Kepler_1610.jpg',
    fallbackIcon: '☀️',
    themeColor: 'from-amber-400 to-yellow-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'huygens',
    name: 'Christiaan Huygens',
    era: '1629 – 1695',
    title: 'Father of Wave Theory & Coupled Oscillator Synchronization',
    badge: '🕰️ Synchronization Pioneer',
    quote: 'The world is my country, science is my religion.',
    description: 'Huygens invented the pendulum clock and discovered the spontaneous synchronization of coupled oscillators vibrating in resonance.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Christiaan_Huygens-painting.jpeg/480px-Christiaan_Huygens-painting.jpeg',
    fallbackIcon: '🕰️',
    themeColor: 'from-cyan-400 to-emerald-400',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'bernoulli',
    name: 'Daniel Bernoulli',
    era: '1700 – 1782',
    title: 'Founder of Fluid Dynamics & Kinetic Vibrations',
    badge: '💨 Kinetic Innovator',
    quote: 'Nature always tends to act in the simplest way.',
    description: 'Bernoulli established hydrodynamic principles and harmonic superposition, demonstrating that vibrating strings resolve into harmonic overtones.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Daniel_Bernoulli.jpg/480px-Daniel_Bernoulli.jpg',
    fallbackIcon: '💨',
    themeColor: 'from-teal-400 to-sky-500',
    borderColor: 'border-teal-400'
  },
  {
    id: 'lagrange',
    name: 'Joseph-Louis Lagrange',
    era: '1736 – 1813',
    title: 'Architect of Analytical Mechanics & Lagrangian Dynamics',
    badge: '⚙️ Lagrangian Maestro',
    quote: 'When we have in view only the determination of the conditions of equilibrium, mechanics is reduced to a purely algebraic process.',
    description: 'Lagrange reformulated classical mechanics into generalized coordinates, producing the equations of motion used in modern structural dynamics.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Lagrange_portrait.jpg/480px-Lagrange_portrait.jpg',
    fallbackIcon: '⚙️',
    themeColor: 'from-indigo-400 to-purple-600',
    borderColor: 'border-indigo-400'
  },
  {
    id: 'cauchy',
    name: 'Augustin-Louis Cauchy',
    era: '1789 – 1857',
    title: 'Pioneer of Continuum Mechanics & Stress Tensors',
    badge: '📏 Continuum Master',
    quote: 'Man passes away; his reason alone remains.',
    description: 'Cauchy formalized stress and strain tensors in deformable bodies, giving engineers the mathematics to predict mechanical fatigue and yield.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Augustin_Louis_Cauchy.jpg/480px-Augustin_Louis_Cauchy.jpg',
    fallbackIcon: '📏',
    themeColor: 'from-blue-400 to-emerald-400',
    borderColor: 'border-blue-400'
  },
  {
    id: 'planck',
    name: 'Max Planck',
    era: '1858 – 1947',
    title: 'Father of Quantum Theory & Discrete Energy Quanta',
    badge: '💡 Quantum Originator',
    quote: 'Science cannot solve the ultimate mystery of nature. And that is because, in the last analysis, we ourselves are part of the mystery.',
    description: 'Planck revolutionized thermodynamics and optics by discovering that vibrating oscillators absorb and radiate energy in discrete quanta.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Max_Planck_%281858-1947%29.jpg/480px-Max_Planck_%281858-1947%29.jpg',
    fallbackIcon: '💡',
    themeColor: 'from-amber-400 to-rose-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'heisenberg',
    name: 'Werner Heisenberg',
    era: '1901 – 1976',
    title: 'Pioneer of Quantum Matrix Mechanics & Wave Uncertainty',
    badge: '🌪️ Quantum Analyst',
    quote: 'What we observe is not nature itself, but nature exposed to our method of questioning.',
    description: 'Heisenberg formulated matrix mechanics and the uncertainty relation between position and momentum in oscillating physical states.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Bundesarchiv_Bild183-R57262%2C_Werner_Heisenberg.jpg/480px-Bundesarchiv_Bild183-R57262%2C_Werner_Heisenberg.jpg',
    fallbackIcon: '🌪️',
    themeColor: 'from-sky-400 to-purple-500',
    borderColor: 'border-sky-400'
  },
  {
    id: 'chandra',
    name: 'Subrahmanyan Chandrasekhar',
    era: '1910 – 1995',
    title: 'Astrophysical Dynamicist & Mathematical Physics Legend',
    badge: '⭐ Stellar Dynamicist',
    quote: 'Science is a perception of the world around us. Science is a place where what you find in truth may not be agreeable with you, but you must accept it.',
    description: 'Nobel laureate Chandrasekhar computed hydrodynamic stability limits and rotational oscillation modes across collapsing stars and plasmas.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Subrahmanyan_Chandrasekhar_1934.jpg/480px-Subrahmanyan_Chandrasekhar_1934.jpg',
    fallbackIcon: '⭐',
    themeColor: 'from-amber-400 to-cyan-500',
    borderColor: 'border-amber-400'
  },
  {
    id: 'franklin',
    name: 'Rosalind Franklin',
    era: '1920 – 1958',
    title: 'Pioneer of X-Ray Wave Diffraction & Structural Crystallography',
    badge: '🧬 Diffraction Specialist',
    quote: 'Science and everyday life cannot and should not be separated.',
    description: 'Analyzing diffraction wave interference patterns, Franklin captured the historic Photo 51 that unraveled the double-helix geometry of DNA.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Rosalind_Franklin.jpg/480px-Rosalind_Franklin.jpg',
    fallbackIcon: '🧬',
    themeColor: 'from-emerald-400 to-purple-400',
    borderColor: 'border-emerald-400'
  },
  {
    id: 'laplace',
    name: 'Pierre-Simon Laplace',
    era: '1749 – 1827',
    title: 'Master of Celestial Perturbations & Laplace Transform',
    badge: '🌠 Transform Pioneer',
    quote: 'What we know is little, and what we are ignorant of is immense.',
    description: 'Laplace developed mathematical transformations that convert complex time-domain differential vibration equations into straightforward algebraic terms.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Pierre-Simon_Laplace.jpg/480px-Pierre-Simon_Laplace.jpg',
    fallbackIcon: '🌠',
    themeColor: 'from-blue-400 to-indigo-500',
    borderColor: 'border-blue-400'
  },
  {
    id: 'boltzmann',
    name: 'Ludwig Boltzmann',
    era: '1844 – 1906',
    title: 'Father of Statistical Mechanics & Thermal Energy Distribution',
    badge: '🔥 Statistical Visionary',
    quote: 'Bring forward what is true, write it so that it is clear, and defend it to your last breath.',
    description: 'Boltzmann linked microscopic molecular vibration to macroscopic thermal properties, introducing entropy and statistical thermodynamics.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Boltzmann2.jpg/480px-Boltzmann2.jpg',
    fallbackIcon: '🔥',
    themeColor: 'from-red-400 to-amber-500',
    borderColor: 'border-red-400'
  },
  {
    id: 'lorentz',
    name: 'Hendrik Lorentz',
    era: '1853 – 1928',
    title: 'Architect of Wave Transformation & Force Dynamics',
    badge: '⚡ Field Theorist',
    quote: 'The most important thing is to maintain the purity of scientific endeavor.',
    description: 'Lorentz derived the transformation equations that describe wave invariance across moving frames of reference in electromagnetic mechanics.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Lorentz3.jpg/480px-Lorentz3.jpg',
    fallbackIcon: '⚡',
    themeColor: 'from-cyan-400 to-blue-500',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'duchatelet',
    name: 'Émilie du Châtelet',
    era: '1706 – 1749',
    title: 'Philosopher of Kinetic Energy & Mechanical Conservation',
    badge: '📖 Energy Conservationist',
    quote: 'Judge me for my own merits, or lack of them, but do not look upon me as a mere appendage.',
    description: 'Émilie du Châtelet translated Newton’s Principia and demonstrated that kinetic energy scales with velocity squared (v²), establishing energy conservation.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Portrait_of_%C3%89milie_du_Ch%C3%A2telet_%281706-1749%29_by_an_anonymous_artist.jpg/480px-Portrait_of_%C3%89milie_du_Ch%C3%A2telet_%281706-1749%29_by_an_anonymous_artist.jpg',
    fallbackIcon: '📖',
    themeColor: 'from-purple-400 to-amber-400',
    borderColor: 'border-purple-400'
  }
];

export function getPersonaForParticipant(
  participant: Participant | null | undefined,
  allParticipants: Participant[] = [],
  callsign: string = ''
): { persona: PhysicistPersona; isCongratulatory: boolean; customMessage: string } {
  const cleanName = (callsign || participant?.callsign || '').trim().toUpperCase();

  // Stable ranking order so EVERY student in the classroom receives a DIFFERENT scientist or mathematician
  const sorted = [...allParticipants].sort((a, b) => {
    const qA = a.questionsCompleted ?? 0;
    const qB = b.questionsCompleted ?? 0;
    if (qB !== qA) return qB - qA;

    const sA = a.score ?? 0;
    const sB = b.score ?? 0;
    if (sB !== sA) return sB - sA;

    const tA = a.totalTimeSeconds && a.totalTimeSeconds > 0 ? a.totalTimeSeconds : 999;
    const tB = b.totalTimeSeconds && b.totalTimeSeconds > 0 ? b.totalTimeSeconds : 999;
    if (tA !== tB) return tA - tB;

    return (a.callsign || '').localeCompare(b.callsign || '');
  });

  let assignedIndex = sorted.findIndex(p => p.callsign.toUpperCase() === cleanName);

  // Fallback hashing if participant is not found in the array
  if (assignedIndex < 0) {
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = (hash << 5) - hash + cleanName.charCodeAt(i);
      hash |= 0;
    }
    assignedIndex = Math.abs(hash);
  }

  const persona = PHYSICIST_PERSONAS[assignedIndex % PHYSICIST_PERSONAS.length];

  const solvedCount = participant?.solvedQuestions?.length ?? participant?.questionsCompleted ?? 0;
  const score = participant?.score ?? participant?.totalScore ?? 0;

  // Congratulatory if solved 4+ questions, score >= 3200, or finished
  const isCongratulatory = solvedCount >= 4 || score >= 3200 || Boolean(participant?.isFinished);

  const customMessage = isCongratulatory
    ? `Congratulations, ${cleanName || 'Harmonic Master'}! You commanded exceptional resonance control and structural breakdown, matching the analytical brilliance of ${persona.name}!`
    : `Encouraging words for ${cleanName || 'Harmonic Contender'}: Great perseverance and effort in the arena! Differential equations and vibration modes take relentless exploration. Like ${persona.name}, every calculation deepens your intuition—keep exploring!`;

  return {
    persona,
    isCongratulatory,
    customMessage
  };
}

interface PhysicistPersonaModalProps {
  isOpen: boolean;
  participant?: Participant | null;
  allParticipants?: Participant[];
  callsign: string;
  onProceed: () => void;
  onJoinAgain?: () => void;
}

export const PhysicistPersonaModal: React.FC<PhysicistPersonaModalProps> = ({
  isOpen,
  participant,
  allParticipants = [],
  callsign,
  onProceed,
  onJoinAgain
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!isOpen) return null;

  const solvedCount = participant?.solvedQuestions?.length ?? participant?.questionsCompleted ?? 0;
  const score = participant?.score ?? participant?.totalScore ?? 0;
  const precision = participant?.precisionPercent ?? 100;
  const timeSecs = participant?.totalTimeSeconds ?? 0;

  const { persona, isCongratulatory, customMessage } = getPersonaForParticipant(participant, allParticipants, callsign);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-5 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-[#0b1322] border-2 border-cyan-400 rounded-3xl p-5 md:p-6 shadow-[0_0_50px_rgba(0,240,255,0.25)] text-center relative overflow-hidden"
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Tag: Congratulatory or Encouraging */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-[11px] font-bold uppercase mb-3 ${
          isCongratulatory
            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
        }`}>
          {isCongratulatory ? <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> : <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{isCongratulatory ? 'Congratulations • Match Complete' : 'Encouraging Words • Match Complete'}</span>
        </div>

        {/* Persona Portrait with Glowing Frame */}
        <div className="relative mx-auto w-28 h-28 md:w-32 md:h-32 mb-3">
          <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] bg-slate-900 flex items-center justify-center relative">
            {!imgFailed ? (
              <img
                src={persona.image}
                alt={persona.name}
                onError={() => setImgFailed(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <span className="text-5xl">{persona.fallbackIcon}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-black/90 border border-amber-400 text-amber-300 font-mono text-[10px] font-bold shadow-md">
            {persona.era}
          </div>
        </div>

        {/* Scientist Persona Title */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-wide">
              {persona.name}
            </h2>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-mono font-bold">
              {persona.badge}
            </span>
          </div>
          <p className="text-xs font-mono text-cyan-300 font-semibold">
            {persona.title}
          </p>
        </div>

        {/* Student Congrats / Encouraging Callout Card */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed mb-3 text-left ${
          isCongratulatory
            ? 'bg-gradient-to-br from-emerald-950/70 to-black/70 border-emerald-500/40 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-gradient-to-br from-cyan-950/70 to-black/70 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
        }`}>
          <div className="flex items-center gap-2 font-bold mb-1.5 text-sm">
            {isCongratulatory ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300">Congratulations, {callsign || 'Solver'}!</span>
              </>
            ) : (
              <>
                <HeartHandshake className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-cyan-300">Great Effort, {callsign || 'Solver'}!</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-200 mb-1.5">
            {customMessage}
          </p>
          <p className="text-[11px] text-slate-400 italic">
            {persona.description}
          </p>
        </div>

        {/* Performance Stats Matrix */}
        <div className="grid grid-cols-4 gap-2 mb-3 bg-[#070b12] p-2.5 rounded-xl border border-cyan-500/20 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-black/40">
            <span className="text-[9px] uppercase text-slate-400 block">Questions</span>
            <span className="text-sm font-bold text-emerald-400">{solvedCount}/10</span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/40">
            <span className="text-[9px] uppercase text-slate-400 block">Score</span>
            <span className="text-sm font-bold text-cyan-300">{score.toLocaleString()}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/40">
            <span className="text-[9px] uppercase text-slate-400 block">Accuracy</span>
            <span className="text-sm font-bold text-amber-300">{precision.toFixed(0)}%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-black/40">
            <span className="text-[9px] uppercase text-slate-400 block">Time</span>
            <span className="text-sm font-bold text-white">{timeSecs > 0 ? `${timeSecs}s` : '2:00'}</span>
          </div>
        </div>

        {/* Inspiring Quote */}
        <div className="bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/30 mb-4 text-left">
          <p className="text-[11px] italic text-slate-300 font-serif leading-snug">
            "{persona.quote}"
          </p>
          <span className="text-[9px] font-mono text-cyan-400 block text-right mt-1 font-bold">
            — {persona.name}
          </span>
        </div>

        {/* Proceed to Leaderboard Button (Before Leaderboard) & Option to Join Again */}
        <div className="space-y-2">
          <button
            onClick={onProceed}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-98 cursor-pointer"
          >
            <span>Reveal Classroom Leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onJoinAgain && (
            <button
              onClick={onJoinAgain}
              className="w-full py-2.5 px-4 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Join Again (Return to Start)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
