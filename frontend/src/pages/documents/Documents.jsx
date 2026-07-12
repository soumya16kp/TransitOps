import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import registryService from '../../services/RegistryService';
import documentService from '../../services/DocumentService';
import './Documents.css';

const DOC_TYPES = [
    { key: 'RC', label: 'RC (Registration)' },
    { key: 'DL', label: 'DL (Driving Licence)' },
    { key: 'Insurance', label: 'Insurance' },
    { key: 'PUC', label: 'PUC Certificate' },
    { key: 'Permit_Fitness', label: 'Permit & Fitness' }
];

const Documents = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');

    // Loading states for specific vehicle cell uploads/deletions
    // Key format: `${vehicleId}_${docType}`
    const [actionLoading, setActionLoading] = useState({});

    const fetchVehicles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await registryService.getVehicles();
            setVehicles(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('Failed to fetch vehicle fleet data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchVehicles();
        }
    }, [fetchVehicles, user]);

    // Handle file selection and upload
    const handleFileUpload = async (vehicleId, docType, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const actionKey = `${vehicleId}_${docType}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: 'uploading' }));

        try {
            await documentService.uploadDocument(vehicleId, docType, file);
            await fetchVehicles(); // Reload fleet data to get nested document updates
        } catch (err) {
            console.error('File upload failed:', err);
            alert(err.error || 'Failed to upload document.');
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: null }));
        }
    };

    // Handle file deletion
    const handleFileDelete = async (vehicleId, docType, docId) => {
        if (!window.confirm(`Delete this document from this vehicle?`)) return;

        const actionKey = `${vehicleId}_${docType}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: 'deleting' }));

        try {
            await documentService.deleteDocument(docId);
            await fetchVehicles();
        } catch (err) {
            console.error('File deletion failed:', err);
            alert('Failed to delete document.');
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: null }));
        }
    };

    // Filter vehicles based on search and type select
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesSearch = 
                v.registration_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = selectedType === 'All' || v.vehicle_type === selectedType;

            return matchesSearch && matchesType;
        });
    }, [vehicles, searchQuery, selectedType]);

    // Role-based Access Control Check
    if (user?.role !== 'admin') {
        return (
            <div className="access-denied-container">
                <i className="fas fa-exclamation-triangle warning-icon"></i>
                <h2>Access Denied</h2>
                <p>This section is restricted to administrators only. You do not have permissions to view or manage legal vehicle files.</p>
            </div>
        );
    }

    return (
        <div className="documents-page-container">
            {/* Filter and Info Header */}
            <div className="docs-control-panel">
                <div className="docs-search-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        placeholder="Search vehicles by name or plate no..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="docs-search-input"
                    />
                </div>
                <div className="docs-filter-group">
                    <label>Vehicle Type:</label>
                    <select 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="docs-filter-select"
                    >
                        <option value="All">All Types</option>
                        <option value="Van">Van</option>
                        <option value="Truck">Truck</option>
                        <option value="Mini">Mini Bus</option>
                        <option value="Bus">Bus</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-state"><i className="fas fa-exclamation-triangle"></i> {error}</div>}

            {loading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i> Loading roadside compliance documents...
                </div>
            ) : (
                <div className="docs-table-wrapper">
                    <table className="docs-table">
                        <thead>
                            <tr>
                                <th>Vehicle Detail</th>
                                <th>Readiness</th>
                                {DOC_TYPES.map(d => (
                                    <th key={d.key}>{d.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVehicles.map(vehicle => {
                                // Find uploaded documents for this vehicle
                                const docsMap = {};
                                vehicle.documents?.forEach(doc => {
                                    docsMap[doc.document_type] = doc;
                                });

                                const uploadedCount = Object.keys(docsMap).length;
                                const readinessPercentage = Math.round((uploadedCount / DOC_TYPES.length) * 100);

                                let readinessClass = 'unprepared';
                                if (readinessPercentage === 100) readinessClass = 'ready';
                                else if (readinessPercentage > 0) readinessClass = 'partial';

                                return (
                                    <tr key={vehicle.id}>
                                        <td className="vehicle-info-cell">
                                            <div className="vehicle-plate">{vehicle.registration_no}</div>
                                            <div className="vehicle-desc">{vehicle.name} • {vehicle.vehicle_type}</div>
                                        </td>
                                        <td>
                                            <span className={`readiness-badge ${readinessClass}`}>
                                                {readinessPercentage}% ({uploadedCount}/{DOC_TYPES.length})
                                            </span>
                                        </td>
                                        {DOC_TYPES.map(type => {
                                            const doc = docsMap[type.key];
                                            const actionKey = `${vehicle.id}_${type.key}`;
                                            const state = actionLoading[actionKey];

                                            return (
                                                <td key={type.key} className="doc-cell">
                                                    {state === 'uploading' || state === 'deleting' ? (
                                                        <div className="cell-spinner-container">
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                            <span className="spinner-text">{state}...</span>
                                                        </div>
                                                    ) : doc ? (
                                                        <div className="doc-badge-container">
                                                            <a 
                                                                href={`http://localhost:8000${doc.file}`}
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="doc-file-link"
                                                                title={`Download ${doc.file_name}`}
                                                            >
                                                                <i className="fas fa-file-pdf pdf-icon"></i>
                                                                <span className="doc-name-label">{doc.file_name}</span>
                                                            </a>
                                                            <button 
                                                                onClick={() => handleFileDelete(vehicle.id, type.key, doc.id)}
                                                                className="delete-doc-btn"
                                                                title="Delete file"
                                                            >
                                                                <i className="fas fa-trash-alt"></i>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="upload-btn-wrapper">
                                                            <label className="custom-file-upload">
                                                                <input 
                                                                    type="file" 
                                                                    onChange={(e) => handleFileUpload(vehicle.id, type.key, e)}
                                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                                />
                                                                <i className="fas fa-cloud-upload-alt upload-icon"></i>
                                                                <span>Upload</span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                            {filteredVehicles.length === 0 && (
                                <tr>
                                    <td colSpan={2 + DOC_TYPES.length} className="empty-row-state">
                                        No vehicles found matching search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Documents;
