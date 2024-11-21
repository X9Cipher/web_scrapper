const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

// MongoDB Connection
mongoose.connect('MONGODB_URI')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schema and model
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: [String], // Changed to an array of strings
  salary: String,
  link: String
});

const Job = mongoose.model('Job', jobSchema);

(async () => {
  const url = 'https://outpace.in/?tm_job_category=technical-support';
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  const jobs = await page.evaluate(() => {
    const jobElements = document.querySelectorAll('.preyantechnosys-post-item');
    let jobData = [];

    jobElements.forEach(job => {
      const title = job.querySelector('h4')?.innerText || 'N/A';
      const company = job.querySelector('.author')?.innerText || 'N/A';
      const locationRaw = job.querySelector('.prt-job-locationtext')?.innerText || 'N/A';
      const location = locationRaw.split(' / ').map(loc => loc.trim()); // Split locations into an array
      const salary = job.querySelector('.prt-job-salarytext')?.innerText || 'N/A';
      const link = job.querySelector('h4 a')?.href || 'N/A';

      jobData.push({
        title: title,
        company: company,
        location: location,
        salary: salary,
        link: link
      });
    });
    return jobData;
  });

  // Save jobs to MongoDB
  for (const job of jobs) {
    const newJob = new Job(job);
    await newJob.save();
  }

  console.log('Jobs saved to MongoDB with split locations');

  await browser.close();
})();
