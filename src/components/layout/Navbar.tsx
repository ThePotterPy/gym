'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  userName?: string | null;
  onOpenLogin?: () => void;
  isAdmin?: boolean;
}

export default function Navbar({ userName, onOpenLogin, isAdmin }: NavbarProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 18px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo Oficial Emporio */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            position: 'relative',
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <Image
              src="/images/emporio-logo.png"
              alt="Logo Emporio Gym & Fitness"
              width={44}
              height={44}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          <div className="navbar-brand-text">
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '0.5px',
              color: 'var(--gray-dark)',
              display: 'block',
              lineHeight: 1,
            }}>
              EMPORIO
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--red-primary)',
              textTransform: 'uppercase',
            }}>
              Gym & Fitness
            </span>
          </div>
        </Link>

        {/* Acceso de Usuario o Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAdmin ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--red-tint)',
              border: '1px solid var(--red-border)',
              color: 'var(--red-primary)',
              fontSize: 12,
              fontWeight: 700,
            }}>
              <ShieldCheck size={15} />
              <span>Panel Entrenador</span>
            </div>
          ) : userName ? (
            <button
              onClick={onOpenLogin}
              type="button"
              aria-label={`Cuenta de ${userName}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--gray-dark)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--red-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span>{userName}</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              type="button"
              className="btn-outline-red"
              style={{ padding: '7px 14px', fontSize: 13 }}
            >
              <User size={15} />
              <span>Ingresar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
