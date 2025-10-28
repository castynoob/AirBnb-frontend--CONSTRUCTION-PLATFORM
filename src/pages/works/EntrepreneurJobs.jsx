import React, { useEffect, useState } from 'react'
import '../../styles/entrepreneur/entrepreneurjobs.css'
import Nav from '../../components/Nav'

function EntrepreneurJobs() {
    const [jobs, setJobs] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchJobs = async () => {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
            const userProfile = localStorage.getItem('userProfile')

            if(userProfile) {
                const user = JSON.parse(userProfile)
                const jobsResponse = await fetch(`${API_BASE_URL}/api/jobs/entrepreneur/${user.entrepProfile.entrepProfile.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                })

                const data = await jobsResponse.json()
                setJobs(data.jobs)
                setIsLoading(false)
            }
        }
        fetchJobs()
    }, [])

    if(isLoading) {
        return (
            <div className="ej-loading-screen">
                <Nav />
                <h1>LOADING...</h1>
            </div>
        )
    }

  return (
    <div className='ej-home-container'>
        <Nav />
        <div className="ej-main-container">
            <div className="ej-job-cards">
            {
                jobs.map((job) =>(
                    <div className="ej-job-card" key={job.id}>
                        <p>{job.title}</p>
                    </div>
                ))
            }
            </div>
        </div>
    </div>
  )
}

export default EntrepreneurJobs