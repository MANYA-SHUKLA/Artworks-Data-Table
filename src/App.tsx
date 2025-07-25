import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRows, setSelectedRows] = useState<Artwork[]>([]);
  const [globalSelectedIds, setGlobalSelectedIds] = useState<Set<number>>(new Set());
  const [showSelectDialog, setShowSelectDialog] = useState<boolean>(false);
  const [rowsToSelect, setRowsToSelect] = useState<number>(10);
  
  const checkboxRef = useRef<HTMLInputElement>(null);

  const fetchData = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
      const data: ApiResponse = await response.json();
      
      setArtworks(data.data || []);
      setTotalRecords(data.pagination?.total || 0);
      
      const currentPageSelected = data.data?.filter(artwork => 
        globalSelectedIds.has(artwork.id)
      ) || [];
      setSelectedRows(currentPageSelected);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setArtworks([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (checkboxRef.current) {
      const partialSelected = selectedRows.length > 0 && selectedRows.length < artworks.length;
      checkboxRef.current.indeterminate = partialSelected;
    }
  }, [selectedRows, artworks]);

  const onPageChange = (event: any) => {
    const newPage = event.page + 1; 
    setCurrentPage(newPage);
  };

  const onSelectionChange = (e: { value: Artwork[] }) => {
    const newSelection = e.value;
    setSelectedRows(newSelection);
    
    const newGlobalIds = new Set(globalSelectedIds);
    
    artworks.forEach(artwork => {
      newGlobalIds.delete(artwork.id);
    });
    
    newSelection.forEach(artwork => {
      newGlobalIds.add(artwork.id);
    });
    
    setGlobalSelectedIds(newGlobalIds);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    const newGlobalIds = new Set(globalSelectedIds);
    
    if (isChecked) {
      artworks.forEach(artwork => {
        newGlobalIds.add(artwork.id);
      });
      setSelectedRows([...artworks]);
    } else {
      artworks.forEach(artwork => {
        newGlobalIds.delete(artwork.id);
      });
      setSelectedRows([]);
    }
    
    setGlobalSelectedIds(newGlobalIds);
  };

  const handleSelectMultiple = () => {
    setShowSelectDialog(true);
  };

  const confirmSelectMultiple = () => {
    const newSelection = artworks.slice(0, rowsToSelect);
    setSelectedRows(newSelection);
    
    const newGlobalIds = new Set(globalSelectedIds);
    
    // First remove all artworks from current page
    artworks.forEach(artwork => {
      newGlobalIds.delete(artwork.id);
    });
    
    // Then add the newly selected ones
    newSelection.forEach(artwork => {
      newGlobalIds.add(artwork.id);
    });
    
    setGlobalSelectedIds(newGlobalIds);
    setShowSelectDialog(false);
  };

  const renderHeader = () => {
    return (
      <div className="flex align-items-center gap-4">
        <div className="flex align-items-center gap-2">
          <Checkbox
            inputRef={checkboxRef}
            checked={selectedRows.length === artworks.length && artworks.length > 0}
            onChange={handleSelectAll}
          />
          <span>Select All</span>
        </div>
        <Button 
          icon="pi pi-list" 
          label="Select Multiple" 
          onClick={handleSelectMultiple}
          className="p-button-sm"
        />
      </div>
    );
  };

  const selectDialogFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={() => setShowSelectDialog(false)} className="p-button-text" />
      <Button label="Select" icon="pi pi-check" onClick={confirmSelectMultiple} autoFocus />
    </div>
  );

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Artworks Data Table</h1>
      <div className="card">
        <DataTable
          value={artworks}
          loading={loading}
          paginator
          rows={10}
          totalRecords={totalRecords}
          lazy
          onPage={onPageChange}
          first={(currentPage - 1) * 10}
          selection={selectedRows}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          dataKey="id"
          header={renderHeader()}
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
          <Column field="title" header="Title" sortable></Column>
          <Column field="artist_display" header="Artist" sortable></Column>
          <Column field="place_of_origin" header="Origin" sortable></Column>
          <Column field="date_start" header="Start Date" sortable></Column>
          <Column field="date_end" header="End Date" sortable></Column>
        </DataTable>
      </div>

      <Dialog 
        header="Select Number of Rows" 
        visible={showSelectDialog} 
        style={{ width: '350px' }}
        modal 
        footer={selectDialogFooter}
        onHide={() => setShowSelectDialog(false)}
      >
        <div className="flex align-items-center gap-3 mt-3">
          <label htmlFor="rowsToSelect" className="font-semibold">Number of rows:</label>
          <InputNumber 
            id="rowsToSelect" 
            value={rowsToSelect} 
            onValueChange={(e) => setRowsToSelect(e.value || 0)} 
            min={1} 
            max={artworks.length}
            showButtons
          />
        </div>
      </Dialog>
    </div>
  );
};

export default App;