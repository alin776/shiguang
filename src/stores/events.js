import { defineStore } from "pinia";
import axios from "axios";

const API_BASE_URL = "http://47.98.210.7:3000";

export const useEventStore = defineStore("events", {
  state: () => ({
    events: [],
    loading: false,
  }),

  actions: {
    async fetchEvents() {
      try {
        this.loading = true;
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.events = response.data.map((event) => ({
          id: event.id,
          title: event.title,
          startTime: event.start_time,
          endTime: event.end_time,
          color: event.color,
          reminder: event.reminder,
        }));
      } catch (error) {
        throw error.response?.data || error;
      } finally {
        this.loading = false;
      }
    },

    async addEvent(eventData) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${API_BASE_URL}/api/events`,
          eventData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        this.events.push({
          id: response.data.id,
          title: response.data.title,
          startTime: response.data.start_time,
          endTime: response.data.end_time,
          color: response.data.color,
          reminder: response.data.reminder,
        });
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async updateEvent(eventId, eventData) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `${API_BASE_URL}/api/events/${eventId}`,
          eventData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const index = this.events.findIndex((e) => e.id === eventId);
        if (index !== -1) {
          this.events[index] = {
            id: response.data.id,
            title: response.data.title,
            startTime: response.data.start_time,
            endTime: response.data.end_time,
            color: response.data.color,
            reminder: response.data.reminder,
          };
        }
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async deleteEvent(eventId) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE_URL}/api/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.events = this.events.filter((e) => e.id !== eventId);
      } catch (error) {
        throw error.response?.data || error;
      }
    },
  },
});
