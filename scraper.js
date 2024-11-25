const puppeteer = require('puppeteer');
const mongoose = require('mongoose');

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect('MONGO_DB_URI');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if connection fails
  }
};

// Define schema and model
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: [String],
  salary: String,
  link: String
});

const Job = mongoose.model('Job', jobSchema);

const scrapeJobs = async (url) => {
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
      const location = locationRaw.split(' / ').map(loc => loc.trim());
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

  await browser.close();
  return jobs;
};

(async () => {
  await connectMongoDB(); // Ensure MongoDB is connected before scraping

  const urls = [
    'https://outpace.in/?tm_job_category=voice-support',
    'https://outpace.in/?tm_job_category=technical-support',
    'https://outpace.in/?tm_job_category=procurement-supply-chain-management',
    'https://outpace.in/?tm_job_category=non-voice-support',
    'https://outpace.in/?tm_job_category=life-science-healthcare',
    'https://outpace.in/?tm_job_category=language-expert',
    'https://outpace.in/?tm_job_category=finance-accounts',
    'https://outpace.in/?tm_job_category=human-resource',
    'https://outpace.in/?tm_job_category=sales-marketing'
   ];

  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    const jobs = await scrapeJobs(url);

    // Save jobs to MongoDB
    for (const job of jobs) {
      const newJob = new Job(job);
      await newJob.save();
    }

    console.log(`Jobs from ${url} saved to MongoDB`);
  }

  console.log('All jobs saved successfully.');
  mongoose.disconnect(); // Disconnect from MongoDB when done
})();
