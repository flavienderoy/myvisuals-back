const supabase = require('../config/supabase');
const { Pool } = require('pg');

// Optional direct DB connection to demonstrate parameterized queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Validates password strength
 * Rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
const isStrongPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

/**
 * Logs authentication attempts securely using explicit parameterized queries
 */
const logAuthAttempt = async (email, eventType, ipAddress, status) => {
  try {
    if (process.env.DATABASE_URL) {
      // Demonstrated Parameterized SQL Query (RNCP Requirement)
      const query = `
        INSERT INTO audit_logs (action, table_name, record_id, changed_by, old_data, new_data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      // Values are passed separately to prevent SQL Injection
      const values = [
        eventType,
        'auth_events',
        null,
        null,
        JSON.stringify({ ip: ipAddress }),
        JSON.stringify({ email, status })
      ];
      await pool.query(query, values);
    } else {
      // Fallback via Supabase SDK if DATABASE_URL is not configured
      await supabase.from('audit_logs').insert([{
        action: eventType,
        table_name: 'auth_events',
        new_data: { email, status, ip: ipAddress }
      }]);
    }
  } catch (error) {
    console.error('Error logging auth attempt:', error);
  }
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user with strong password validation
 */
exports.register = async (req, res) => {
  const { email, password, name, role, siret, organization } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email || !password) {
    await logAuthAttempt(email, 'REGISTER', ip, 'FAILED_MISSING_CREDENTIALS');
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  // 1. Password Strength Validation (Backend Enforcement)
  if (!isStrongPassword(password)) {
    await logAuthAttempt(email, 'REGISTER', ip, 'FAILED_WEAK_PASSWORD');
    return res.status(400).json({ 
      error: 'Mot de passe trop faible',
      details: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
    });
  }

  try {
    const userRole = role === 'studio' ? 'studio' : 'client';

    // 2. Call Supabase Admin API to create user securely
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: userRole, siret, organization }
    });

    if (error) {
      await logAuthAttempt(email, 'REGISTER', ip, 'FAILED_SUPABASE_ERROR');
      return res.status(400).json({ error: error.message });
    }

    // 3. Explicitly upsert profile in public.profiles to guarantee DB role matches
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: name || '',
        email: email,
        role: userRole,
        siret: siret || null,
        organization: organization || null
      });
    } catch (profErr) {
      console.error('Error upserting profile in register:', profErr);
    }

    await logAuthAttempt(email, 'REGISTER', ip, 'SUCCESS');
    
    // We return success, but client still needs to log in to get session
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: data.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      await logAuthAttempt(email, 'LOGIN', ip, 'FAILED_INVALID_CREDENTIALS');
      // Generic error message to prevent account enumeration
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    await logAuthAttempt(email, 'LOGIN', ip, 'SUCCESS');
    res.status(200).json({ session: data.session, user: data.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset email
 */
exports.forgotPassword = async (req, res) => {
  const { email, redirectTo } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!email) {
    return res.status(400).json({ error: 'Adresse email requise' });
  }

  try {
    const redirectUrl = redirectTo || `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      await logAuthAttempt(email, 'FORGOT_PASSWORD', ip, 'FAILED');
      return res.status(400).json({ error: error.message });
    }

    await logAuthAttempt(email, 'FORGOT_PASSWORD', ip, 'SUCCESS');
    res.status(200).json({ message: 'Un e-mail de réinitialisation vous a été envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

/**
 * @route POST /api/auth/reset-password
 * @desc Reset user password using active token or session
 */
exports.resetPassword = async (req, res) => {
  const { password, accessToken } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!password) {
    return res.status(400).json({ error: 'Le nouveau mot de passe est requis' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Mot de passe trop faible',
      details: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
    });
  }

  try {
    const token = accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Session non autorisée ou jeton expiré' });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Jeton invalide ou expiré' });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });

    if (error) {
      await logAuthAttempt(user.email, 'RESET_PASSWORD', ip, 'FAILED');
      return res.status(400).json({ error: error.message });
    }

    await logAuthAttempt(user.email, 'RESET_PASSWORD', ip, 'SUCCESS');
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

