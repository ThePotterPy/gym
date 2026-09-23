'use client';

import React from 'react';
import { Home, Dumbbell, BookOpen, Clock } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'today' | 'train' | 'exercises' | 'history';
  onChangeTab: (tab: 'today' | 'train' | 'exercises' | 'history') => void;
}

export default function BottomNav({ currentTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'today', label: 'Hoy', icon: Home },
    { id: 'train', label: 'Entrenar', icon: Dumbbell },
    { id: 'exercises', label: 'Ejercicios', icon: BookOpen },
    { id: 'history', label: 'Historial', icon: Clock },
  ] as const;

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            style={{
              cursor: 'pointer',
              color: isActive ? 'var(--red-primary)' : 'var(--gray-muted)',
            }}
          >
            <div style={{
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{ fontSize: 11, fontWeight: isActive ? 800 : 600 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
