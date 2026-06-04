import { create } from 'zustand'

const useJobStore = create((set) => ({
  results: [],
  selected: null,
  query: '',
  location: 'Dhaka',
  searched: false,
  agentMsg: '',

  setResults: (results) => set({ results }),
  setSelected: (selected) => set({ selected }),
  setQuery: (query) => set({ query }),
  setLocation: (location) => set({ location }),
  setSearched: (searched) => set({ searched }),
  setAgentMsg: (agentMsg) => set({ agentMsg }),
  clearSearch: () => set({ results: [], selected: null, searched: false, agentMsg: '' })
}))

export default useJobStore