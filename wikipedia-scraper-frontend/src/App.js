import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
    const [urls, setUrls] = useState('');
    const [fields, setFields] = useState([]);
    const [values, setValues] = useState([]);
    const [selectedField, setSelectedField] = useState('');
    const [selectedValues, setSelectedValues] = useState([]);
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch available filter fields
    const fetchFields = async () => {
        try {
            const response = await axios.get('http://51.20.191.161:8000/api/filters/');
            setFields(response.data.fields);
        } catch (error) {
            console.error('Error fetching fields:', error);
        }
    };

    // Fetch filter values for a specific field
    const fetchValues = async (field) => {
        try {
            setSelectedValues([]); // Clear previously selected values
            const response = await axios.get(`http://51.20.191.161:8000/api/filters/?field=${field}`);
            setValues(response.data.values);
        } catch (error) {
            console.error('Error fetching values:', error);
        }
    };

    // Handle scraping request
    const handleScraping = async () => {
        if (!urls.trim()) {
            alert('Please enter at least one URL.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post('http://51.20.191.161:8000/api/scrape/', { urls: urls.split('\n') });
            alert(response.data.message);
        } catch (error) {
            console.error('Error during scraping:', error);
            alert('Failed to scrape URLs');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle applying selected filters
    const handleApplyFilters = async () => {
        if (!selectedField) {
            alert('Please select a field.');
            return;
        }
        if (selectedValues.length === 0) {
            alert('Please select at least one value.');
            return;
        }

        // Log the selected field and values for debugging
        console.log('Selected Field:', selectedField);
        console.log('Selected Values:', selectedValues);

        try {
            // Format the filters as an array of objects { field: value }
            const formattedFilters = selectedValues.map(value => ({
              field: selectedField,  // Add the selected field
              value: value            // Add the selected value
          }));
          
          // Log formatted filters for debugging
          console.log('Formatted Filters:', formattedFilters);
          
          // Prepare params as key-value pairs for the request
          const params = {};
          formattedFilters.forEach((filter, index) => {
              params[`filters[${index}][field]`] = filter.field;
              params[`filters[${index}][value]`] = filter.value;
          });
          
          // Log params for debugging
          console.log('Params:', params);
          
          // Send filter request to the backend
          const response = await axios.get('http://51.20.191.161:8000/api/filtered-results/', { params });

            console.log('Filtered Results:', response.data.pages);
            setPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching pages:', error);
            alert('Failed to fetch filtered results.');
        }
    };

    useEffect(() => {
        fetchFields();  // Fetch filter fields on component mount
    }, []);

    return (
        <div className="app">
            <h1 className="title">Wikipedia Scraper</h1>

            {/* Scraping Section */}
            <div className="scraper-section">
                <textarea
                    placeholder="Enter URLs (one per line, up to 50)"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    className="url-input"
                />
                <button onClick={handleScraping} className="scrape-button" disabled={isLoading}>
                    {isLoading ? 'Scraping...' : 'Scrape URLs'}
                </button>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <h2>Filters</h2>
                <select
                    value={selectedField}
                    onChange={(e) => {
                        setSelectedField(e.target.value);
                        fetchValues(e.target.value);  // Fetch values when a field is selected
                    }}
                    className="field-select"
                >
                    <option value="">Select Field</option>
                    {fields.map((field, index) => (
                        <option key={index} value={field}>{field}</option>
                    ))}
                </select>

                <div className="values-container">
                    {values.map((value, index) => (
                        <label key={index} className="value-label">
                            <input
                                type="checkbox"
                                value={value}
                                checked={selectedValues.includes(value)}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedValues((prev) =>
                                        checked ? [...prev, value] : prev.filter((val) => val !== value)
                                    );
                                }}
                            />
                            {value}
                        </label>
                    ))}
                </div>

                <button onClick={handleApplyFilters} className="apply-button">Apply Filters</button>
            </div>

            {/* Results Section */}
            <div className="results-section">
                <h2>Results</h2>
                <ul className="results-list">
                    {pages.map((page, index) => (
                        <li key={index} className="result-item">
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                                {page.title}
                            </a>
                            <p>Downloaded: {new Date(page.timestamp).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default App;
