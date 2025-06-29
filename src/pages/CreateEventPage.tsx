import React, { useState } from 'react';
import { CreateEventForm } from '../components/events/CreateEventForm';

export const CreateEvent: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (eventData: any) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Event created:', eventData);
    
    // In a real app, we'd redirect to the event page or show success message
    alert('Event created successfully!');
    
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    // In a real app, we'd navigate back
    console.log('Create event cancelled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CreateEventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
      
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="text-gray-900">Creating event...</span>
          </div>
        </div>
      )}
    </div>
  );
};