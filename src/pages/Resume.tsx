import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { motion } from 'framer-motion';

const Resume = () => {
  const skills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'SQL',
    'Git',
    'AWS',
  ];

  const experiences = [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Company',
      period: '2020 - Present',
      description: [
        'Led development of key features for flagship product',
        'Mentored junior developers and conducted code reviews',
        'Implemented CI/CD pipelines and improved deployment process',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Startup Inc',
      period: '2018 - 2020',
      description: [
        'Developed and maintained full-stack web applications',
        'Collaborated with cross-functional teams to deliver features',
        'Optimized application performance and reduced load times',
      ],
    },
  ];

  const education = {
    degree: 'Bachelor of Science in Computer Science',
    school: 'University Name',
    year: '2018',
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h2" gutterBottom>
          Resume
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Skills
          </Typography>
          <Box sx={{ mb: 4 }}>
            {skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                sx={{ m: 0.5 }}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Experience
          </Typography>
          {experiences.map((exp, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <Typography variant="h6">{exp.title}</Typography>
              <Typography color="primary" gutterBottom>
                {exp.company}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {exp.period}
              </Typography>
              <List>
                {exp.description.map((item, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}

          <Divider sx={{ my: 4 }} />

          <Typography variant="h5" gutterBottom>
            Education
          </Typography>
          <Typography variant="h6">{education.degree}</Typography>
          <Typography color="primary" gutterBottom>
            {education.school}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {education.year}
          </Typography>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Resume;
