'use client'

import { useState } from 'react'

interface Bed {
  id: string
  bed_number: number
  room_id: string
}

interface ApplicationModalProps {
  isOpen: boolean
  beds: Bed[]
  onClose: () => void
  onSubmit: (details: { registration_number: string; national_id: string; bed_id: string; gender: string }) => void
}

export default function ApplicationModal({ isOpen, beds, onClose, onSubmit }: ApplicationModalProps) {
  const [details, setDetails] = useState({
    registration_number: '',
    national_id: '',
    bed_id: '',
    gender: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(details)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Apply for Property</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Registration Number
            </label>
            <input
              type="text"
              name="registration_number"
              id="registration_number"
              value={details.registration_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="national_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              National ID
            </label>
            <input
              type="text"
              name="national_id"
              id="national_id"
              value={details.national_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              value={details.gender}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="bed_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select a Bed
            </label>
            <select
              name="bed_id"
              id="bed_id"
              value={details.bed_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">--Please choose an option--</option>
              {beds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  Bed {bed.bed_number}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}