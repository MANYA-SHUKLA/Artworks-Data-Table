import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
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
  const [selectCount, setSelectCount] = useState<string>('');

  const [globalSelectedIds, setGlobalSelectedIds] = useState<Set<number>>(new Set());
  
  const overlayPanelRef = useRef<OverlayPanel>(null);
  const checkboxRef = useRef<Checkbox>(null);

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
    const allSelected = artworks.length > 0 && selectedRows.length === artworks.length;
    const partialSelected = selectedRows.length > 0 && selectedRows.length < artworks.length;

    // Set 'indeterminate' state manually using ref
    if (checkboxRef.current) {
      checkboxRef.current.state.indeterminate = partialSelected;
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

  const handleSelectAll = () => {
    if (selectedRows.length === artworks.length) {
      const newGlobalIds = new Set(globalSelectedIds);
      artworks.forEach(artwork => {
        newGlobalIds.delete(artwork.id);
      });
      setGlobalSelectedIds(newGlobalIds);
      setSelectedRows([]);
    } else {
      const newGlobalIds = new Set(globalSelectedIds);
      artworks.forEach(artwork => {
        newGlobalIds.add(artwork.id);
      });
      setGlobalSelectedIds(newGlobalIds);
      setSelectedRows([...artworks]);
    }
  };

  const handleCustomSelection = () => {
    const count = parseInt(selectCount);
    if (isNaN(count) || count <= 0) return;

    setGlobalSelectedIds(new Set());
    setSelectedRows([]);
    
    const newGlobalIds = new Set<number>();
    
    const itemsPerPage = 12;
    let remainingCount = count;
    let pageToCheck = 1;
    
    const currentPageSelection = artworks.slice(0, Math.min(remainingCount, artworks.length));
    currentPageSelection.forEach(artwork => {
      newGlobalIds.add(artwork.id);
    });
    
    setGlobalSelectedIds(newGlobalIds);
    setSelectedRows(currentPageSelection);
    setSelectCount('');
    overlayPanelRef.current?.hide();
  };

  const renderHeader = () => {
    const allSelected = artworks.length > 0 && selectedRows.length === artworks.length;
    const partialSelected = selectedRows.length > 0 && selectedRows.length < artworks.length;
    
    return (
      <div className="flex align-items-center gap-2">
        <Checkbox
          ref={checkboxRef}
          checked={allSelected}
          indeterminate={partialSelected}
          onChange={handleSelectAll}
        />
        <Button
          icon="pi pi-chevron-down"
          className="p-button-text p-button-sm"
          onClick={(e) => overlayPanelRef.current?.toggle(e)}
        />
        <OverlayPanel ref={overlayPanelRef}>
          <div className="p-3">
            <label htmlFor="selectCount" className="block mb-2">
              Select number of rows:
            </label>
            <InputText
              id="selectCount"
              value={selectCount}
              onChange={(e) => setSelectCount(e.target.value)}
              placeholder="Enter number"
              className="mb-3 w-full"
            />
            <Button
              label="Submit"
              onClick={handleCustomSelection}
              className="w-full"
              disabled={!selectCount || isNaN(parseInt(selectCount))}
            />
          </div>
        </OverlayPanel>
        <span className="ml-2">
          {globalSelectedIds.size} row(s) selected across all pages
        </span>
      </div>
    );
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value || 'N/A';
    return String(value);
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Artworks Data Table</h1>
      
      <div className="card">
        <DataTable
          value={artworks}
          loading={loading}
          paginator
          rows={12}
          totalRecords={totalRecords}
          lazy
          onPage={onPageChange}
          first={(currentPage - 1) * 12}
          selection={selectedRows}
          onSelectionChange={onSelectionChange}
          selectionMode="multiple"
          dataKey="id"
          header={renderHeader()}
          responsiveLayout="scroll"
          emptyMessage="No artworks found"
          loadingIcon={<ProgressSpinner style={{ width: '50px', height: '50px' }} />}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          
          <Column
            field="title"
            header="Title"
            body={(rowData) => (
              <div className="max-w-xs truncate" title={formatValue(rowData.title)}>
                {formatValue(rowData.title)}
              </div>
            )}
            sortable
          />
          
          <Column
            field="place_of_origin"
            header="Place of Origin"
            body={(rowData) => (
              <div className="max-w-xs truncate" title={formatValue(rowData.place_of_origin)}>
                {formatValue(rowData.place_of_origin)}
              </div>
            )}
            sortable
          />
          
          <Column
            field="artist_display"
            header="Artist Display"
            body={(rowData) => (
              <div className="max-w-xs truncate" title={formatValue(rowData.artist_display)}>
                {formatValue(rowData.artist_display)}
              </div>
            )}
            sortable
          />
          
          <Column
            field="inscriptions"
            header="Inscriptions"
            body={(rowData) => (
              <div className="max-w-xs truncate" title={formatValue(rowData.inscriptions)}>
                {formatValue(rowData.inscriptions)}
              </div>
            )}
            sortable
          />
          
          <Column
            field="date_start"
            header="Date Start"
            body={(rowData) => formatValue(rowData.date_start)}
            sortable
          />
          
          <Column
            field="date_end"
            header="Date End"
            body={(rowData) => formatValue(rowData.date_end)}
            sortable
          />
        </DataTable>
      </div>
    </div>
  );
};

export default App;
