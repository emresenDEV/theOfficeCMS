import React, { useState, useEffect, Suspense } from 'react'; //include Suspense in brackets for React.lazy

// A rotating circle or a progress bar
const LoadingSpinner = () => <div className="spinner">Loading...</div>;

const DataFetchingComponent = () => {
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
    fetch('/api/data')
    .then((response) => response.json())
    .then((data) => {
        setData(data);
        setLoading(false);
    });
}, []);

return (
    <div>
    {loading ? <LoadingSpinner /> : <div>{data.content}</div>}
    </div>
);
};

// Gray boxes that match the size and shpae of the content being loaded
const Skeleton = () => (
    <div style={{ background: '#e0e0e0', height: '20px', marginBottom: '10px' }} />
);

const SkeletonScreen = () => (
    <div>
    <Skeleton />
    <Skeleton />
    <Skeleton />
    </div>
);

// Optimized API Calls (Batching)
const fetchBatch = async (userIds) => {
    const response = await fetch(`/api/users?ids=${userIds.join(',')}`);
    return response.json();
};

// Using localStorage:
const fetchWithCache = async (url) => {
    const cachedData = localStorage.getItem(url);

    if (cachedData) {
    return JSON.parse(cachedData);
    }

    const response = await fetch(url);
    const data = await response.json();
    localStorage.setItem(url, JSON.stringify(data));
    return data;
};

// React.lazy
const LazyComponent = React.lazy(() => import('./MyComponent'));

const App = () => (
    <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
    </Suspense>
);